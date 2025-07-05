<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\ClassSubjectSchedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClassSubjectScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $classroom = Classroom::first();
        $subjects = Subject::where('is_archived', false)->get();
        $teachers = User::whereHas('role', function ($q) {
            $q->where('name', 'teacher');
        })->get();

        if ($classroom && $subjects->count() > 0 && $teachers->count() > 0) {
            $days = [1, 2, 3, 4, 5]; // Senin-Jumat
            $startHours = ['07:00', '08:00', '09:00', '10:00', '13:00'];
            $endHours = ['08:00', '09:00', '10:00', '11:00', '14:00'];

            foreach ($subjects as $index => $subject) {
                $day = $days[$index % count($days)];
                $teacher = $teachers->random();

                ClassSubjectSchedule::create([
                    'class_id' => $classroom->id,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teacher->id,
                    'day' => $day,
                    'start_hour' => $startHours[$index % count($startHours)],
                    'end_hour' => $endHours[$index % count($endHours)],
                ]);
            }

            $this->command->info('Class subject schedules seeded successfully!');
        } else {
            $this->command->error('Required data not found! Please seed users, classrooms and subjects first.');
        }
    }
}
