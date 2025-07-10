<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Event;
use App\Models\EventAttendance;
use Carbon\Carbon;
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
                    'clock_in_hour' => $status === 'present_in_tolerance'
                        ? Carbon::parse($event->start_hour)->addMinutes(rand(0, 5))
                        : Carbon::parse($event->start_hour),
                    'clock_out_hour' => Carbon::parse($event->end_hour)->addMinutes(rand(0, 10)),
                    'status' => $status,
                    'minutes_of_late' => $status === 'present' ? null : rand(0, 15),
                    'note' => $status !== 'present' ? 'Alasan: ' . fake()->sentence() : null,
                ]);
            }
        }
    }
}
