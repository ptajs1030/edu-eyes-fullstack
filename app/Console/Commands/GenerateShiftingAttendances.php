<?php

namespace App\Console\Commands;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Enums\ShiftAttendanceStatus;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\CustomDayOff;
use App\Models\ShiftingAttendance;
use App\Models\Student;
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

        $now = now('Asia/Jakarta');
        $currentTime = $now->format('H:i');
        $todayDate = $now->toDateString();

        // Hanya jalan antara 00:00 - 00:05 WIB
        if ($currentTime < '00:00' || $currentTime > '00:05') {
            Log::info('[Cron] Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan.');
            $this->info('Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan..');
            return;
        }

        Log::info('Cron generate attendance running...');

        // 1. check attendance_mode == per-shift
        $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)
            ->where('attendance_mode', AttendanceMode::PerShift->value)
            ->first();

        if (!$academicYear) {
            Log::info('No active academic year with shifting attendance mode found');
            return;
        }

        // 2. Check is today is day off
        $isDayOff = CustomDayOff::where('date', $todayDate)->exists();
        if ($isDayOff) {
            Log::info('[Cron] Hari ini (' . $todayDate . ') adalah custom day off, command tidak dijalankan.');
            $this->info('Hari ini adalah custom day off, command tidak dijalankan.');
            return;
        }
        // 3. Get class shifting schedules
        // $today = Carbon::now();
        $today = $now;
        $todayDate = $today->toDateString();
        $todayDayOfWeek = $today->dayOfWeek;
        $schedules = ClassShiftingSchedule::where('day', $todayDayOfWeek)
            ->with('shifting')
            ->get();

        // 4. Gather every class that has students
        $classIds = Classroom::pluck('id')->toArray();
        $generatedCount = 0;


        foreach ($classIds as $classId) {
            $students = Student::where('class_id', $classId)->get();
            if ($students->isEmpty()) continue;

            $schedulesForClass = $schedules->where('class_id', $classId);

            if ($schedulesForClass->isEmpty()) {
                foreach ($students as $student) {
                    $exists = ShiftingAttendance::where([
                        'student_id' => $student->id,
                        'submit_date' => $todayDate,
                    ])->exists();
                    if ($exists) continue;

                    ShiftingAttendance::create([
                        'student_id'          => $student->id,
                        'class_id'            => $classId,
                        'academic_year_id'    => $academicYear->id,
                        'shifting_name'       => '',
                        'shifting_start_hour' => '',
                        'shifting_end_hour'   => '',
                        'submit_date'         => $todayDate,
                        'status'              => ShiftAttendanceStatus::DayOff->value,
                    ]);

                    $generatedCount++;
                }
            } else {
                foreach ($schedulesForClass as $schedule) {
                    foreach ($students as $student) {
                        $exists = ShiftingAttendance::where([
                            'student_id'    => $student->id,
                            'submit_date'   => $todayDate,
                        ])->exists();
                        if ($exists) continue;

                        ShiftingAttendance::create([
                            'student_id'          => $student->id,
                            'class_id'            => $classId,
                            'academic_year_id'    => $academicYear->id,
                            'shifting_name'       => $schedule->shifting->name,
                            'shifting_start_hour' => $schedule->shifting->start_hour,
                            'shifting_end_hour'   => $schedule->shifting->end_hour,
                            'submit_date'         => $todayDate,
                            'status'              => ShiftAttendanceStatus::Alpha->value,
                        ]);

                        $generatedCount++;
                    }
                }
            }
        }

        Log::info("Generated {$generatedCount} shifting attendances for {$todayDate}");
        $this->info("Successfully generated {$generatedCount} shifting attendances.");
    }
}
