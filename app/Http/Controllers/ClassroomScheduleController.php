<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\Shifting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
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
        if ($academicYear->attendance_mode !== AttendanceMode::PerShift->value) {
            return Inertia::render('Error', [
                'message' => 'Sistem presensi saat ini menggunakan mode per subject, fitur shifting tidak tersedia'
            ]);
        }

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

        return Inertia::render('classrooms/schedule', [
            'classroom' => $classroom,
            'days' => $days,
            'shiftings' => $shiftings,
            'teachers' => $teachers,
            'academicYear' => $academicYear,
        ]);
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
