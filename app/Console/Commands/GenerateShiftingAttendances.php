<?php

namespace App\Console\Commands;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceStatus;
use App\Models\AcademicYear;
use App\Models\ClassShiftingSchedule;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateShiftingAttendances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:generate-shifting';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily shifting attendances from schedules';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // 1. check attendance_mode == per-subject
        $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)
            ->where('attendance_mode', 'per-shift')
            ->first();

        if (!$academicYear) {
            Log::info('No active academic year with shifting attendance mode found');
            return;
        }

        // 2. Get class shifting schedules
        $today = Carbon::now();
        $todayDayOfWeek = $today->dayOfWeek;

        $schedules = ClassShiftingSchedule::where('day', $todayDayOfWeek)
            ->with('shifting')
            ->get();

        if ($schedules->isEmpty()) {
            Log::info('No shifting schedules found for today (Day: ' . $todayDayOfWeek . ')');
            return;
        }

        // 3. Generate shifting attendances
        $generatedCount = 0;

        foreach ($schedules as $schedule) {
            // Check if the data already exists
            $students = Student::where('class_id', $schedule->class_id)->get();
            if ($students->isEmpty()) {
                continue;
            }
            foreach ($students as $student) {
                $existingAttendance  = ShiftingAttendance::where([
                    'student_id' => $student->id,
                    'submit_date' => $today,
                ])->exists();

                if ($existingAttendance) continue;

                // Generate attendance data (status alpha)
                ShiftingAttendance::create([
                    'student_id' => $student->id,
                    'class_id' => $schedule->class_id,
                    'academic_year_id' => $academicYear->id,
                    'shifting_name' => $schedule->shifting->name,
                    'shifting_start_hour' => $schedule->shifting->start_hour,
                    'shifting_end_hour' => $schedule->shifting->end_hour,
                    'submit_date' => $today,
                    'status' => AttendanceStatus::Alpha->value,
                ]);

                $generatedCount++;
            }
        }

        Log::info("Generated {$generatedCount} shifting attendances for {$today->toDateString()}");
        $this->info("Successfully generated {$generatedCount} shifting attendances.");
    }
}
