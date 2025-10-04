<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\ClassSubjectSchedule;
use App\Models\Shifting;
use App\Models\Subject;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ClassroomScheduleController extends Controller
{
    private function formatTime($time)
    {
        return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
    }

    public function showScheduleForm(Classroom $classroom): Response
    {
        $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->firstOrFail();

        return Inertia::render('classrooms/schedule', [
            'classroom' => $classroom,
            'days' => $this->getShiftScheduleData($classroom),
            'shiftings' => $this->getShiftingsData(),
            'teachers' => $this->getTeachersData(),
            'academicYear' => $academicYear,
            'subjectSchedulesByDay' => $this->getSubjectScheduleData($classroom),
            'subjects' => $this->getActiveSubjects(),
            'refreshed_schedules' => session('refreshed_schedules'),
        ]);
    }

    protected function getShiftScheduleData(Classroom $classroom): array
    {
        $existingSchedules = ClassShiftingSchedule::with(['shifting', 'teachers'])
            ->where('class_id', $classroom->id)
            ->get()
            ->keyBy('day');

        $days = [];
        $dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu'];

        for ($day = 1; $day <= 7; $day++) {
            $schedule = $existingSchedules->get($day);
            $teachers = $schedule ? $schedule->teachers : collect();

            $days[] = [
                'day' => $day,
                'day_name' => $dayNames[$day - 1],
                'shifting_id' => $schedule?->shifting_id,
                'teachers' => $teachers->pluck('id')->toArray(),
                'shifting' => $schedule?->shifting,
                'selected_teachers' => $teachers->map(fn($t) => [
                    'id' => $t->id,
                    'name' => $t->full_name
                ])->toArray(),
            ];
        }

        return $days;
    }

    protected function getSubjectScheduleData(Classroom $classroom): array
    {
        $subjectSchedules = ClassSubjectSchedule::with(['subject', 'teacher'])
            ->where('class_id', $classroom->id)
            ->orderBy('day')
            ->orderBy('start_hour')
            ->get()
            ->groupBy('day');

        $subjectSchedulesByDay = [];
        for ($day = 1; $day <= 7; $day++) {
            $subjectSchedulesByDay[$day] = $subjectSchedules->get($day, collect())
                ->map(fn($s) => [
                    'id' => $s->id,
                    'subject_id' => $s->subject_id,
                    'subject_name' => $s->subject?->name,
                    'teacher_id' => $s->teacher_id,
                    'teacher_name' => $s->teacher?->full_name,
                    'start_hour' => $this->formatTime($s->start_hour),
                    'end_hour' => $this->formatTime($s->end_hour),
                ])
                ->toArray();
        }

        return $subjectSchedulesByDay;
    }

    protected function getShiftingsData(): array
    {
        return Shifting::all(['id', 'name', 'start_hour', 'end_hour'])
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'start_hour' => $this->formatTime($s->start_hour),
                'end_hour' => $this->formatTime($s->end_hour),
            ])
            ->toArray();
    }

    protected function getTeachersData(): array
    {
        return User::whereHas('role', fn($q) => $q->where('name', 'teacher'))
            ->get(['id', 'full_name'])
            ->toArray();
    }

    protected function getActiveSubjects(): array
    {
        return Subject::where('is_archived', false)
            ->get(['id', 'name'])
            ->toArray();
    }

    protected function validateAcademicYear(string $expectedMode): void
    {
        $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->firstOrFail();
        if ($academicYear->attendance_mode !== $expectedMode) {
            throw new Exception("Attendance mode is not set to {$expectedMode}");
        }
    }

    // Pre-validate payload agar tidak ada tabrakan internal (per hari & per guru)
    protected function assertNoInternalConflicts(array $schedules): void
    {
        $byDay = collect($schedules)->groupBy('day');

        foreach ($byDay as $day => $items) {
            // Cek overlap antar slot di hari yang sama (tanpa peduli subject)
            $sorted = collect($items)->sortBy('start_hour')->values();
            for ($i = 1; $i < $sorted->count(); $i++) {
                $prev = $sorted[$i - 1];
                $curr = $sorted[$i];
                if ($curr['start_hour'] < $prev['end_hour']) {
                    throw new Exception("Terjadi overlap jadwal pada hari {$this->getDayName($day)} antara {$prev['start_hour']}-{$prev['end_hour']} dan {$curr['start_hour']}-{$curr['end_hour']}");
                }
            }

            // Cek konflik guru pada hari yang sama
            $byTeacher = collect($items)->groupBy('teacher_id');
            foreach ($byTeacher as $teacherId => $rows) {
                if (!$teacherId) continue;

                $teacher = User::find($teacherId);
                $teacherName = $teacher ? $teacher->full_name : "Guru ID {$teacherId}";

                $sortedT = $rows->sortBy('start_hour')->values();
                for ($i = 1; $i < $sortedT->count(); $i++) {
                    $prev = $sortedT[$i - 1];
                    $curr = $sortedT[$i];
                    if ($curr['start_hour'] < $prev['end_hour']) {
                        throw new Exception("{$teacherName} memiliki jadwal yang bertumpuk pada hari {$this->getDayName($day)}: {$prev['start_hour']}-{$prev['end_hour']} dan {$curr['start_hour']}-{$curr['end_hour']}");
                    }
                }
            }
        }
    }

    private function getDayName(int $day): string
    {
        $dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu'];
        return $dayNames[$day - 1] ?? "Hari {$day}";
    }

    public function saveSubjectSchedule(Request $request, Classroom $classroom)
    {
        try {
            $this->validateAcademicYear(AttendanceMode::PerSubject->value);

            $validated = $request->validate($this->getSubjectScheduleValidationRules());
            $this->assertNoInternalConflicts($validated['schedules']);;

            DB::transaction(function () use ($classroom, $validated) {
                $this->processSubjectSchedules($classroom, $validated['schedules']);
            });

            return redirect()->back()
                ->with('success', 'Jadwal mata pelajaran berhasil diperbarui')
                ->with('refreshed_schedules', $this->getSubjectScheduleData($classroom));
        } catch (ValidationException $e) {
            return $this->handleValidationError($e);
        } catch (Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui jadwal: ' . $e->getMessage())
                ->withInput($request->all());
        }
    }

    protected function getSubjectScheduleValidationRules(): array
    {
        return [
            'schedules' => 'array',
            'schedules.*.id' => 'nullable|exists:class_subject_schedules,id',
            'schedules.*.day' => 'required|integer|min:1|max:7',
            'schedules.*.subject_id' => 'required|exists:subjects,id',
            'schedules.*.teacher_id' => 'required|exists:users,id',
            'schedules.*.start_hour' => 'required|date_format:H:i',
            'schedules.*.end_hour' => [
                'required',
                'date_format:H:i',
                'after:schedules.*.start_hour',
            ],
        ];
    }

    protected function validateTeacherAvailability(array $scheduleData, array $excludeIds = []): void
    {
        $start = Carbon::createFromFormat('H:i', $scheduleData['start_hour'])->format('H:i:s');
        $end = Carbon::createFromFormat('H:i', $scheduleData['end_hour'])->format('H:i:s');

        $overlappingQuery = ClassSubjectSchedule::where('teacher_id', $scheduleData['teacher_id'])
            ->where('day', $scheduleData['day'])
            ->where(function ($query) use ($start, $end) {
                $query->where(function ($q) use ($start, $end) {
                    $q->where('start_hour', '<', $end)
                        ->where('end_hour', '>', $start);
                });
            });

        if (!empty($scheduleData['id'])) {
            $overlappingQuery->where('id', '!=', $scheduleData['id']);
        }
        if (!empty($excludeIds)) {
            $overlappingQuery->whereNotIn('id', $excludeIds);
        }

        $overlapping = $overlappingQuery->first();
        if ($overlapping) {
            $teacher = User::find($scheduleData['teacher_id']);
            $teacherName = $teacher ? $teacher->full_name : "Guru ID {$scheduleData['teacher_id']}";
            throw new Exception("{$teacherName} sudah memiliki jadwal pada hari {$this->getDayName($scheduleData['day'])} di waktu yang sama: {$overlapping->start_hour} - {$overlapping->end_hour}");
        }
    }

    protected function processSubjectSchedules(Classroom $classroom, array $schedules): void
    {
        $existingIds = [];
        $batchIds = collect($schedules)->pluck('id')->filter()->values()->all();

        foreach ($schedules as $scheduleData) {
            if (empty($scheduleData['subject_id']) || empty($scheduleData['teacher_id'])) {
                continue;
            }

            $this->validateNoTimeOverlaps($classroom, $scheduleData, $batchIds);
            $this->validateTeacherAvailability($scheduleData, $batchIds);

            $schedule = $this->updateOrCreateSubjectSchedule($classroom, $scheduleData);
            $existingIds[] = $schedule->id;
        }

        $this->removeOrphanedSchedules($classroom, $existingIds);
    }

    protected function validateNoTimeOverlaps(Classroom $classroom, array $scheduleData, array $excludeIds = []): void
    {
        $start = Carbon::createFromFormat('H:i', $scheduleData['start_hour'])->format('H:i:s');
        $end = Carbon::createFromFormat('H:i', $scheduleData['end_hour'])->format('H:i:s');

        $overlappingQuery = ClassSubjectSchedule::where('class_id', $classroom->id)
            ->where('day', $scheduleData['day'])
            ->where(function ($query) use ($start, $end) {
                $query->where(function ($q) use ($start, $end) {
                    $q->where('start_hour', '<', $end)
                        ->where('end_hour', '>', $start);
                });
            });

        if (!empty($scheduleData['id'])) {
            $overlappingQuery->where('id', '!=', $scheduleData['id']);
        }
        if (!empty($excludeIds)) {
            $overlappingQuery->whereNotIn('id', $excludeIds);
        }

        $overlapping = $overlappingQuery->first();
        if ($overlapping) {
            throw new Exception("Jadwal bertabrakan dengan jadwal yang sudah ada pada hari {$this->getDayName($scheduleData['day'])}: {$overlapping->start_hour} - {$overlapping->end_hour}");
        }
    }

    protected function updateOrCreateSubjectSchedule(Classroom $classroom, array $data)
    {
        $formattedData = [
            'class_id' => $classroom->id,
            'subject_id' => $data['subject_id'],
            'teacher_id' => $data['teacher_id'],
            'day' => $data['day'],
            'start_hour' => Carbon::createFromFormat('H:i', $data['start_hour'])->format('H:i:s'),
            'end_hour' => Carbon::createFromFormat('H:i', $data['end_hour'])->format('H:i:s'),
        ];

        if (!empty($data['id'])) {
            // find, update, lalu return model
            $schedule = ClassSubjectSchedule::findOrFail($data['id']);
            $schedule->update($formattedData);
            return $schedule;
        } else {
            return ClassSubjectSchedule::create($formattedData);
        }
    }

    protected function removeOrphanedSchedules(Classroom $classroom, array $keepIds): void
    {
        ClassSubjectSchedule::where('class_id', $classroom->id)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }

    public function saveShiftSchedule(Request $request, Classroom $classroom)
    {
        try {
            $this->validateAcademicYear(AttendanceMode::PerShift->value);

            $validated = $request->validate($this->getShiftScheduleValidationRules());

            DB::transaction(function () use ($classroom, $validated) {
                $this->processShiftSchedules($classroom, $validated['days']);
            });

            return redirect()->back()->with('success', 'Jadwal berhasil diperbarui');
        } catch (ValidationException $e) {
            return $this->handleValidationError($e);
        } catch (Exception $e) {
            return $this->handleGenericError($e);
        }
    }

    protected function getShiftScheduleValidationRules(): array
    {
        return [
            'days' => 'required|array|size:7',
            'days.*.day' => 'required|integer|min:1|max:7',
            'days.*.shifting_id' => 'nullable|exists:shiftings,id',
            'days.*.teachers' => [
                'nullable',
                'array',
                Rule::requiredIf(function () {
                    return collect(request('days'))->contains(fn($d) => !is_null($d['shifting_id']) && empty($d['teachers']));
                }),
                'exists:users,id'
            ],
            'days.*.teachers.*' => 'exists:users,id'
        ];
    }

    protected function processShiftSchedules(Classroom $classroom, array $days): void
    {
        foreach ($days as $dayData) {
            if ($dayData['shifting_id']) {
                $this->updateOrCreateShiftSchedule($classroom, $dayData);
            } else {
                $this->removeShiftSchedule($classroom, $dayData['day']);
            }
        }
    }

    protected function updateOrCreateShiftSchedule(Classroom $classroom, array $dayData): void
    {
        $schedule = ClassShiftingSchedule::updateOrCreate(
            ['class_id' => $classroom->id, 'day' => $dayData['day']],
            ['shifting_id' => $dayData['shifting_id']]
        );

        $schedule->teachers()->sync($dayData['teachers'] ?? []);
    }

    protected function removeShiftSchedule(Classroom $classroom, int $day): void
    {
        $schedule = ClassShiftingSchedule::where([
            'class_id' => $classroom->id,
            'day' => $day
        ])->first();

        if ($schedule) {
            $schedule->pics()->delete();
            $schedule->delete();
        }
    }

    protected function handleValidationError(ValidationException $e)
    {
        return redirect()->back()
            ->withErrors($e->validator)
            ->withInput();
    }

    protected function handleGenericError(Exception $e)
    {
        return redirect()->back()
            ->with('error', 'Gagal memperbarui jadwal: ' . $e->getMessage())
            ->withInput();
    }
}
