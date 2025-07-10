<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Event;
use App\Models\EventAttendance;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EventAttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $academicYear = AcademicYear::where('status', 'active')->first();
        $events = Event::all();

        foreach ($events as $event) {
            $participants = $event->participants;
            $statuses = ['present', 'present_in_tolerance', 'alpha', 'late'];

            foreach ($participants as $participant) {
                $status = $statuses[array_rand($statuses)];

                $attendance = EventAttendance::create([
                    'student_id' => $participant->student_id,
                    'event_id' => $event->id,
                    'academic_year_id' => $academicYear->id,
                    'submit_date' => now(),
                    'clock_in_hour' => $status === 'present' ? $event->start_hour->addMinutes(rand(0, 30)) : null,
                    'clock_out_hour' => $status === 'present' ? $event->end_hour->subMinutes(rand(0, 30)) : null,
                    'status' => $status,
                    'minutes_of_late' => $status === 'present' ? rand(0, 30) : null,
                    'note' => $status !== 'present' ? 'Alasan: ' . fake()->sentence() : null,
                ]);
            }
        }
    }
}
