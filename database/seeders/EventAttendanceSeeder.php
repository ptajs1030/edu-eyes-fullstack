<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventParticipant;
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
        // Get active academic year
        $academicYear = AcademicYear::where('status', 'active')->first();
        
        if (!$academicYear) {
            $this->command->error('No active academic year found!');
            return;
        }

        // Get all events with their participants
        $events = Event::with('participants')->get();

        foreach ($events as $event) {
            // Skip future events (no attendance yet)
            if ($event->start_date > Carbon::today()) {
                continue;
            }

            foreach ($event->participants as $participant) {
                // Determine attendance status with realistic probabilities
                $status = $this->determineAttendanceStatus($event);
                
                // Generate realistic clock times based on status
                $clockTimes = $this->generateClockTimes($event, $status);

                EventAttendance::create([
                    'student_id' => $participant->student_id,
                    'event_id' => $event->id,
                    'academic_year_id' => $academicYear->id,
                    'submit_date' => $event->start_date,
                    'clock_in_hour' => $clockTimes['clock_in'],
                    'clock_out_hour' => $clockTimes['clock_out'],
                    'status' => $status,
                    'minutes_of_late' => $clockTimes['minutes_late'],
                    'note' => $this->generateNote($status),
                ]);
            }
        }

        $this->command->info('Successfully seeded event attendances!');
    }

    /**
     * Determine realistic attendance status with probabilities
     */
    protected function determineAttendanceStatus(Event $event): string
    {
        $probabilities = [
            'present' => 70,         // 70% chance
            'present_in_tolerance' => 15, // 15% chance
            'late' => 10,            // 10% chance
            'alpha' => 5             // 5% chance
        ];

        $random = rand(1, 100);
        $cumulative = 0;

        foreach ($probabilities as $status => $probability) {
            $cumulative += $probability;
            if ($random <= $cumulative) {
                return $status;
            }
        }

        return 'present'; // default
    }

    /**
     * Generate realistic clock times based on status
     */
    protected function generateClockTimes(Event $event, string $status): array
    {
        $start = Carbon::parse($event->start_hour);
        $end = Carbon::parse($event->end_hour);

        return match ($status) {
            'present' => [
                'clock_in' => $start->copy()->subMinutes(rand(0, 30)), // Early or on time
                'clock_out' => $end->copy()->addMinutes(rand(0, 30)),
                'minutes_late' => null
            ],
            'present_in_tolerance' => [
                'clock_in' => $start->copy()->addMinutes(rand(1, 15)),
                'clock_out' => $end->copy()->addMinutes(rand(0, 30)),
                'minutes_late' => rand(1, 15)
            ],
            'late' => [
                'clock_in' => $start->copy()->addMinutes(rand(16, 120)),
                'clock_out' => $end->copy()->addMinutes(rand(0, 60)),
                'minutes_late' => rand(16, 120)
            ],
            'alpha' => [
                'clock_in' => $start->copy()->format('H:i:s'), // Atau waktu default
                'clock_out' => $end->copy()->format('H:i:s'),  // Atau waktu default
                'minutes_late' => null
            ],
            default => [
                'clock_in' => $start,
                'clock_out' => $end,
                'minutes_late' => null
            ]
        };
    }

    /**
     * Generate appropriate notes based on status
     */
    protected function generateNote(string $status): ?string
    {
        return match ($status) {
            'present' => null,
            'present_in_tolerance' => 'Datang terlambat dalam batas toleransi',
            'late' => fake()->randomElement([
                'Terjadi kemacetan di jalan',
                'Kendaraan bermasalah',
                'Ada urusan keluarga mendadak'
            ]),
            'alpha' => fake()->randomElement([
                'Sakit',
                'Izin orang tua',
                'Tidak ada kabar'
            ]),
            default => null
        };
    }
}