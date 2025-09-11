<?php

namespace App\Console\Commands;

use App\Enums\AcademicYearStatus;
use App\Enums\StudentStatus;
use App\Models\AcademicYear;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventParticipant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateEventAttendances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:generate-event';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily event attendances for custom events';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now('Asia/Jakarta');
        $currentTime = $now->format('H:i');
        $todayDate = $now->toDateString();

        // Hanya jalan antara 00:15 - 00:20 WIB
        if ($currentTime < '00:15' || $currentTime > '00:20') {
            Log::info('[Cron] Event Attendance Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan.');
            $this->info('Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan..');
            return;
        }

        Log::info('Cron generate event attendance running...');

        $academicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->first();

        if (!$academicYear) {
            Log::info('No active academic year found');
            $this->info('No active academic year found');
            return;
        }

        $events = Event::whereDate('start_date', '<=', $todayDate)
            ->whereDate('end_date', '>=', $todayDate)
            ->get();

        if ($events->isEmpty()) {
            Log::info('[Cron Event] Tidak ada custom event yang berlangsung pada: ' . $todayDate);
            $this->info('Tidak ada custom event yang berlangsung hari ini.');
            return;
        }

        $generatedCount = 0;

        foreach ($events as $event) {
            $this->info("Processing event: {$event->name}");

            $participants = EventParticipant::where('event_id', $event->id)
                ->with('student')
                ->get();

            if ($participants->isEmpty()) {
                $this->info("No participants found for event: {$event->name}");
                continue;
            }

            foreach ($participants as $participant) {
                $student = $participant->student;

                if ($student->status !== StudentStatus::Active->value) {
                    Log::info("Skipping inactive student: {$student->full_name}");
                    continue;
                }

                $exists = EventAttendance::where([
                    'student_id' => $student->id,
                    'event_id' => $event->id,
                    'submit_date' => $todayDate,
                ])->exists();

                if ($exists) {
                    Log::info("Attendance already exists for student: {$student->full_name}, event: {$event->name}");
                    continue;
                }

                EventAttendance::create([
                    'student_id' => $student->id,
                    'event_id' => $event->id,
                    'academic_year_id' => $academicYear->id,
                    'submit_date' => $todayDate,
                    'clock_in_hour' => null,
                    'clock_out_hour' => null,
                    'status' => 'alpha',
                    'minutes_of_late' => null,
                    'note' => null,
                ]);

                $generatedCount++;
                Log::info("Generated attendance for student: {$student->full_name}, event: {$event->name}");
            }
        }

        Log::info("Generated {$generatedCount} event attendances for {$todayDate}");
        $this->info("Successfully generated {$generatedCount} event attendances.");
    }
}
