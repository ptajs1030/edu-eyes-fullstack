<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventAttendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EventScheduleController extends Controller
{
    private function formatTimeForDisplay($time)
    {
        return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
    }

    private function formatTimeForDatabase($time)
    {
        return Carbon::createFromFormat('H:i', $time)->format('H:i:s');
    }

    public function showAttendance(Event $event, Request $request)
    {
        $event->load(['eventPics.user', 'participants.student.classroom']);

        // Build query untuk attendance dengan filter dan sorting
        $attendancesQuery  = EventAttendance::where('event_id', $event->id)
            ->with(['student.classroom']);

        if ($request->has('dates') && !empty($request->dates)) {
            $attendancesQuery->whereIn('submit_date', $request->dates);
        }

        $attendancesQuery->orderBy('submit_date')
            ->orderBy('student_id');

        $attendances = $attendancesQuery->paginate(10);

        $formattedAttendances = $attendances->getCollection()->map(function ($attendance) {
            return [
                'id' => $attendance->id,
                'student' => [
                    'id' => $attendance->student->id,
                    'full_name' => $attendance->student->full_name,
                    'nis' => $attendance->student->nis,
                    'classroom' => $attendance->student->classroom
                ],
                'status' => $attendance->status,
                'clock_in_hour' => $attendance->clock_in_hour ? $this->formatTimeForDisplay($attendance->clock_in_hour) : null,
                'clock_out_hour' => $attendance->clock_out_hour ? $this->formatTimeForDisplay($attendance->clock_out_hour) : null,
                'minutes_of_late' => $attendance->minutes_of_late,
                'note' => $attendance->note,
                'submit_date' => $attendance->submit_date,
            ];
        });

        $attendances->setCollection($formattedAttendances);

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
            'filters' => $request->only(['dates']),
            'canEditAttendance' => $event->start_date <= now()->format('Y-m-d') && $attendances->isNotEmpty(),
        ]);
    }

    public function updateAttendance(Request $request, Event $event)
    {
        if ($event->start_date > now()->format('Y-m-d')) {
            return redirect()->back()
                ->with('error', 'Cannot update attendance for future event');
        }

        try {
            $validated = $request->validate([
                'student_id' => 'required|exists:students,id',
                'status' => 'required|in:present,present_in_tolerance,alpha,late',
                'clock_in_hour' => 'nullable|date_format:H:i',
                'clock_out_hour' => 'nullable|date_format:H:i',
                'note' => 'nullable|string|max:255',
            ]);

            $attendanceData = [
                'academic_year_id' => 1, // Sesuaikan dengan academic year yang aktif
                'status' => $validated['status'],
                'note' => $validated['note'] ?? null,
            ];

            // Format waktu untuk database jika ada
            if (!empty($validated['clock_in_hour'])) {
                $attendanceData['clock_in_hour'] = $this->formatTimeForDatabase($validated['clock_in_hour']);
            }

            if (!empty($validated['clock_out_hour'])) {
                $attendanceData['clock_out_hour'] = $this->formatTimeForDatabase($validated['clock_out_hour']);
            }

            $attendance = EventAttendance::updateOrCreate(
                [
                    'event_id' => $event->id,
                    'student_id' => $validated['student_id'],
                ],
                $attendanceData
            );

            return redirect()->back()
                ->with('success', 'Kehadiran berhasil diperbarui');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui kehadiran: ' . $e->getMessage());
        }
    }
}
