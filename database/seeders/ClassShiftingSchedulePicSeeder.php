<?php

namespace Database\Seeders;

use App\Models\ClassShiftingSchedule;
use App\Models\ClassShiftingSchedulePic;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClassShiftingSchedulePicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teachers = User::where('role_id', 2)->get();
        $classShiftingSchedules = ClassShiftingSchedule::all();

        foreach ($classShiftingSchedules as $schedule) {
            $teacher = $teachers->random();

            ClassShiftingSchedulePic::create([
                'class_shifting_schedule_id' => $schedule->id,
                'teacher_id' => $teacher->id,
            ]);
        }
    }
}
