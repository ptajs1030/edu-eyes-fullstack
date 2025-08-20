<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventAttendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventScheduleController extends Controller
{
    private function formatTimeForDisplay($time)
    {
        return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
    }

    public function showAttendance(Event $event)
    {
        $event->load(['eventPics.user', 'participants.student.classroom']);

        // Get attendances dengan relasi student
        $attendances = EventAttendance::where('event_id', $event->id)
            ->with(['student.classroom'])
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'student' => [
                        'id' => $attendance->student->id,
                        'full_name' => $attendance->student->full_name,
                        'nis' => $attendance->student->nis,
                        'classroom' => $attendance->student->classroom
                    ],
                    'status' => $attendance->status,
                    'clock_in_hour' => $this->formatTimeForDisplay($attendance->clock_in_hour),
                    'clock_out_hour' => $this->formatTimeForDisplay($attendance->clock_out_hour),
                    'minutes_of_late' => $attendance->minutes_of_late,
                    'note' => $attendance->note,
                    'submit_date' => $attendance->submit_date,
                ];
            });

        // Format waktu event untuk display
        $formattedEvent = [
            'id' => $event->id,
            'name' => $event->name,
            'description' => $event->description,
            'start_date' => $event->start_date,
            'end_date' => $event->end_date,
            'start_hour' => $this->formatTimeForDisplay($event->start_hour),
            'end_hour' => $this->formatTimeForDisplay($event->end_hour),
            'event_pics' => $event->eventPics->map(function ($pic) {
                return [
                    'user' => [
                        'full_name' => $pic->user->full_name
                    ]
                ];
            }),
            'participants' => $event->participants->map(function ($participant) {
                return [
                    'student' => [
                        'id' => $participant->student->id,
                        'full_name' => $participant->student->full_name,
                        'nis' => $participant->student->nis,
                        'classroom' => $participant->student->classroom
                    ]
                ];
            })
        ];

        return Inertia::render('events/attendance', [
            'event' => $formattedEvent,
            'attendances' => $attendances,
            'canEditAttendance' => $event->start_date <= now()->format('Y-m-d') && $attendances->isNotEmpty(),
        ]);
    }
}
