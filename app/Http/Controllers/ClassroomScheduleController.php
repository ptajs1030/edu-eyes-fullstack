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
use Illuminate\Support\Facades\Validator;
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

        $shiftings = Shifting::all(['id', 'name', 'start_hour', 'end_hour'])->map(function ($shifting) {
            return [
                'id' => $shifting->id,
                'name' => $shifting->name,
                'start_hour' => $this->formatTime($shifting->start_hour),
                'end_hour' => $this->formatTime($shifting->end_hour),
            ];
        });;

        $teachers = User::whereHas('role', function ($query) {
            $query->where('name', 'teacher');
        })->get(['id', 'full_name']);

        $existingSchedules = ClassShiftingSchedule::with(['shifting', 'teachers'])
            ->where('class_id', $classroom->id)
            ->get()
            ->keyBy('day');

        // Format data untuk 7 hari
        $days = [];
        $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        for ($day = 1; $day <= 7; $day++) {
            $schedule = $existingSchedules->get($day);

            $teacherIds = [];
            $selectedTeachers = [];

            if ($schedule) {
                $teacherIds = $schedule->teachers->pluck('id')->toArray();
                $selectedTeachers = $schedule->teachers->map(function ($teacher) {
                    return [
                        'id' => $teacher->id,
                        'name' => $teacher->full_name
                    ];
                })->toArray();
            }

            $days[] = [
                'day' => $day,
                'day_name' => $dayNames[$day - 1],
                'shifting_id' => $schedule ? $schedule->shifting_id : null,
                'teachers' => $teacherIds,
                'sihfting' => $schedule ? $schedule->shifting : null,
                'selected_teachers' => $selectedTeachers,
            ];
        }

        // ----------------------------------------

        $subjectSchedules = ClassSubjectSchedule::with(['subject', 'teacher'])
            ->where('class_id', $classroom->id)
            ->get()
            ->groupBy('day');

        $subjectSchedulesByDay = [];
        for ($day = 1; $day <= 7; $day++) {
            $schedules = $subjectSchedules->get($day, collect())->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'subject_id' => $schedule->subject_id,
                    'subject_name' => $schedule->subject->name,
                    'teacher_id' => $schedule->teacher_id,
                    'teacher_name' => $schedule->teacher->full_name,
                    'start_hour' => $this->formatTime($schedule->start_hour),
                    'end_hour' => $this->formatTime($schedule->end_hour),
                ];
            })->toArray();

            $subjectSchedulesByDay[$day] = $schedules;
        }

        // Get active subjects
        $subjects = Subject::where('is_archived', false)
            ->get(['id', 'name']);

        return Inertia::render('classrooms/schedule', [
            'classroom' => $classroom,
            'days' => $days,
            'shiftings' => $shiftings,
            'teachers' => $teachers,
            'academicYear' => $academicYear,
            'subjectSchedulesByDay' => $subjectSchedulesByDay,
            'subjects' => $subjects,
        ]);
    }

    // public function saveSubjectSchedule(Request $request, Classroom $classroom)
    // {
    //     try {
    //         $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->firstOrFail();
    //         if ($academicYear->attendance_mode !== AttendanceMode::PerSubject->value) {
    //             throw new Exception('Attendance mode is not set to subject-based');
    //         }

    //         $validated = $request->validate([
    //             'schedules' => 'required|array',
    //             'schedules.*.day' => 'required_with:schedules.*.subject_id|integer|min:1|max:7',
    //             'schedules.*.subject_id' => 'required_with:schedules.*.day|exists:subjects,id',
    //             'schedules.*.teacher_id' => 'required_with:schedules.*.day|exists:users,id',
    //             'schedules.*.start_hour' => 'required_with:schedules.*.day|date_format:H:i',
    //             'schedules.*.end_hour' => 'required_with:schedules.*.day|date_format:H:i|after:schedules.*.start_hour',
    //         ]);

    //         DB::beginTransaction();

    //         // Delete existing schedules
    //         ClassSubjectSchedule::where('class_id', $classroom->id)->delete();

    //         // Create new schedules
    //         foreach ($validated['schedules'] as $scheduleData) {
    //             // Check for overlapping schedules
    //             $overlapping = ClassSubjectSchedule::where('class_id', $classroom->id)
    //                 ->where('day', $scheduleData['day'])
    //                 ->where(function ($query) use ($scheduleData) {
    //                     $query->where(function ($q) use ($scheduleData) {
    //                         $q->where('start_hour', '<', $scheduleData['end_hour'])
    //                             ->where('end_hour', '>', $scheduleData['start_hour']);
    //                     });
    //                 })
    //                 ->exists();

    //             if ($overlapping) {
    //                 throw new Exception("Schedule overlaps with another subject on day {$scheduleData['day']}");
    //             }

    //             ClassSubjectSchedule::create([
    //                 'class_id' => $classroom->id,
    //                 'subject_id' => $scheduleData['subject_id'],
    //                 'teacher_id' => $scheduleData['teacher_id'],
    //                 'day' => $scheduleData['day'],
    //                 'start_hour' => $scheduleData['start_hour'],
    //                 'end_hour' => $scheduleData['end_hour'],
    //             ]);
    //         }

    //         DB::commit();

    //         return redirect()->back()
    //             ->with('success', 'Subject schedule successfully updated');
    //     } catch (ValidationException $e) {
    //         DB::rollBack();
    //         return redirect()->back()
    //             ->withErrors($e->validator)
    //             ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
    //             ->withInput();
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         return redirect()->back()
    //             ->with('error', 'Failed to update schedule: ' . $e->getMessage())
    //             ->withInput();
    //     }
    // }

    // public function saveSubjectSchedule(Request $request, Classroom $classroom)
    // {
    //     try {
    //         $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->firstOrFail();
    //         if ($academicYear->attendance_mode !== AttendanceMode::PerSubject->value) {
    //             throw new Exception('Attendance mode is not set to subject-based');
    //         }

    //         dd($request);

    //         $validated = $request->validate([
    //             'schedules' => 'required|array',
    //             'schedules.*.day' => 'required_with:schedules.*.subject_id|integer|min:1|max:7',
    //             'schedules.*.subject_id' => 'required_with:schedules.*.day|exists:subjects,id',
    //             'schedules.*.teacher_id' => 'required_with:schedules.*.day|exists:users,id',
    //             'schedules.*.start_hour' => 'required_with:schedules.*.day|date_format:H:i',
    //             'schedules.*.end_hour' => 'required_with:schedules.*.day|date_format:H:i|after:schedules.*.start_hour',
    //         ]);

    //         DB::beginTransaction();

    //         // Hapus semua jadwal yang ada
    //         ClassSubjectSchedule::where('class_id', $classroom->id)->delete();

    //         // Filter hanya data yang valid
    //         $validSchedules = array_filter($validated['schedules'], function ($schedule) {
    //             return isset($schedule['day']) &&
    //                 isset($schedule['subject_id']) &&
    //                 isset($schedule['teacher_id']);
    //         });

    //         foreach ($validSchedules as $scheduleData) {
    //             // Validasi jam bentrok
    //             $overlapping = ClassSubjectSchedule::where('class_id', $classroom->id)
    //                 ->where('day', $scheduleData['day'])
    //                 ->where(function ($query) use ($scheduleData) {
    //                     $query->where(function ($q) use ($scheduleData) {
    //                         $q->where('start_hour', '<', $scheduleData['end_hour'])
    //                             ->where('end_hour', '>', $scheduleData['start_hour']);
    //                     });
    //                 })
    //                 ->exists();

    //             if ($overlapping) {
    //                 throw new Exception("Schedule overlaps with another subject on day {$scheduleData['day']}");
    //             }

    //             ClassSubjectSchedule::create([
    //                 'class_id' => $classroom->id,
    //                 'subject_id' => $scheduleData['subject_id'],
    //                 'teacher_id' => $scheduleData['teacher_id'],
    //                 'day' => $scheduleData['day'],
    //                 'start_hour' => $scheduleData['start_hour'],
    //                 'end_hour' => $scheduleData['end_hour'],
    //             ]);
    //         }

    //         DB::commit();

    //         return redirect()->back()
    //             ->with('success', 'Subject schedule successfully updated');
    //     } catch (Exception $e) {
    //         DB::rollBack();
    //         return redirect()->back()
    //             ->with('error', 'Failed to update schedule: ' . $e->getMessage())
    //             ->withInput();
    //     }
    // }

    public function saveSubjectSchedule(Request $request, Classroom $classroom)
    {
        try {
            $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->firstOrFail();
            if ($academicYear->attendance_mode !== AttendanceMode::PerSubject->value) {
                throw new Exception('Attendance mode is not set to subject-based');
            }
            dd($request->all());
            $schedules = $request->input('schedules', []);

            // Validasi manual untuk menangani array kosong
            $validator = Validator::make(['schedules' => $schedules], [
                'schedules' => 'required|array',
                'schedules.*.id' => 'nullable|exists:class_subject_schedules,id',
                'schedules.*.day' => 'required|integer|min:1|max:7',
                'schedules.*.subject_id' => 'required|exists:subjects,id',
                'schedules.*.teacher_id' => 'required|exists:users,id',
                'schedules.*.start_hour' => 'required|date_format:H:i',
                'schedules.*.end_hour' => 'required|date_format:H:i|after:schedules.*.start_hour',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            DB::beginTransaction();

            $existingIds = [];

            foreach ($schedules as $scheduleData) {
                // Skip invalid data
                if (empty($scheduleData['subject_id']) || empty($scheduleData['teacher_id'])) {
                    continue;
                }

                // Format waktu ke format database
                $startHour = Carbon::createFromFormat('H:i', $scheduleData['start_hour'])->format('H:i:s');
                $endHour = Carbon::createFromFormat('H:i', $scheduleData['end_hour'])->format('H:i:s');

                // Cek bentrok jadwal (kecuali jadwal itu sendiri jika update)
                $overlappingQuery = ClassSubjectSchedule::where('class_id', $classroom->id)
                    ->where('day', $scheduleData['day'])
                    ->where(function ($query) use ($startHour, $endHour) {
                        $query->where(function ($q) use ($startHour, $endHour) {
                            $q->where('start_hour', '<', $endHour)
                                ->where('end_hour', '>', $startHour);
                        });
                    });

                if (!empty($scheduleData['id'])) {
                    $overlappingQuery->where('id', '!=', $scheduleData['id']);
                }

                $overlapping = $overlappingQuery->exists();

                if ($overlapping) {
                    throw new Exception("Schedule overlaps with another subject on day {$scheduleData['day']}");
                }

                // Update atau create schedule
                if (!empty($scheduleData['id'])) {
                    $schedule = ClassSubjectSchedule::find($scheduleData['id']);
                    $schedule->update([
                        'subject_id' => $scheduleData['subject_id'],
                        'teacher_id' => $scheduleData['teacher_id'],
                        'start_hour' => $startHour,
                        'end_hour' => $endHour,
                    ]);
                    $existingIds[] = $schedule->id;
                } else {
                    $schedule = ClassSubjectSchedule::create([
                        'class_id' => $classroom->id,
                        'subject_id' => $scheduleData['subject_id'],
                        'teacher_id' => $scheduleData['teacher_id'],
                        'day' => $scheduleData['day'],
                        'start_hour' => $startHour,
                        'end_hour' => $endHour,
                    ]);
                    $existingIds[] = $schedule->id;
                }
            }

            // Hapus jadwal yang tidak ada dalam request
            ClassSubjectSchedule::where('class_id', $classroom->id)
                ->whereNotIn('id', $existingIds)
                ->delete();

            DB::commit();

            return redirect()->back()
                ->with('success', 'Subject schedule successfully updated');
        } catch (ValidationException $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to update schedule: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function saveSchedule(Request $request, Classroom $classroom)
    {
        try {
            $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->firstOrFail();
            if ($academicYear->attendance_mode !== AttendanceMode::PerShift->value) {
                throw new Exception('Attendance mode is not set to shifting');
            }

            $validated = $request->validate([
                'days' => 'required|array|size:7',
                'days.*.day' => 'required|integer|min:1|max:7',
                'days.*.shifting_id' => 'nullable|exists:shiftings,id',
                'days.*.teachers' => [
                    'nullable',
                    'array',
                    Rule::requiredIf(function () use ($request) {
                        return collect($request->days)->contains(
                            fn($day) =>
                            $day['shifting_id'] !== null && empty($day['teachers'])
                        );
                    }),
                    'exists:users,id'
                ],
                'days.*.teachers.*' => 'exists:users,id'
            ]);

            DB::beginTransaction();

            foreach ($validated['days'] as $dayData) {
                $day = $dayData['day'];

                if ($dayData['shifting_id']) {
                    // Validasi teacher harus ada jika shifting diisi
                    if (empty($dayData['teachers'])) {
                        throw new Exception("Teachers are required when shifting is set for day {$day}");
                    }

                    // Update atau create schedule
                    $schedule = ClassShiftingSchedule::updateOrCreate(
                        [
                            'class_id' => $classroom->id,
                            'day' => $day
                        ],
                        [
                            'shifting_id' => $dayData['shifting_id']
                        ]
                    );

                    // Sync teachers
                    $schedule->teachers()->sync($dayData['teachers']);
                } else {
                    // Hapus schedule jika shifting_id null
                    $schedule = ClassShiftingSchedule::where([
                        'class_id' => $classroom->id,
                        'day' => $day
                    ])->first();

                    if ($schedule) {
                        // Hapus PICs terlebih dahulu
                        $schedule->pics()->delete();
                        $schedule->delete();
                    }
                }
            }

            DB::commit();

            return redirect()->back()
                ->with('success', 'Schedule successfully updated');
        } catch (ValidationException $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to update schedule: ' . $e->getMessage())
                ->withInput();
        }
    }
}
