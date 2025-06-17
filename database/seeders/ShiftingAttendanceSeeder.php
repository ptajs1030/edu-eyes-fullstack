<?php

namespace Database\Seeders;

use App\Models\ClassShiftingSchedule;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ShiftingAttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $nextDay = Carbon::now()->addDay()->format('Y-m-d');
        $classShiftingSchedules = ClassShiftingSchedule::where('day', Carbon::now()->addDay()->dayOfWeek)->get();

        foreach ($classShiftingSchedules as $schedule) {
            // Get all student in the class
            $students = Student::where('class_id', $schedule->class_id)->get();

            // create attendance for each student
            foreach ($students as $student) {
                ShiftingAttendance::create([
                    'student_id' => $student->id,
                    'class_shifting_schedule_id' => $schedule->id,
                    'submit_date' => $nextDay,
                    'status' => 'alpha',
                ]);
            }
        }
    }
}
