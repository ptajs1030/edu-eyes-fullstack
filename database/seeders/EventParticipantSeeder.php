<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventParticipant;
use App\Models\Student;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EventParticipantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $events = Event::all();
        $students = Student::all();

        foreach ($events as $event) {
            $participantCount = rand(5, 8);
            $selectedStudents = $students->random($participantCount);

            foreach ($selectedStudents as $student) {
                EventParticipant::create([
                    'event_id' => $event->id,
                    'student_id' => $student->id,
                ]);
            }
        }
    }
}
