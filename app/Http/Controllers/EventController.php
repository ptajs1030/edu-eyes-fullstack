<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Event;
use App\Models\EventParticipant;
use App\Models\EventPic;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    private function formatTimeForDisplay($time)
    {
        return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
    }

    private function formatTimeForDatabase($time)
    {
        return Carbon::createFromFormat('H:i', $time)->format('H:i:s');
    }

    public function index(Request $request): Response
    {
        $events = Event::query()
            ->with(['eventPics.user'])
            ->withCount('participants')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'start_date', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString();

        $events->getCollection()->transform(function ($event) {
            return [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
                'start_hour' => $this->formatTimeForDisplay($event->start_hour),
                'end_hour' => $this->formatTimeForDisplay($event->end_hour),
                'event_pics' => $event->eventPics,
                'participants_count' => $event->participants_count,
            ];
        });

        return Inertia::render('events/index', [
            'events' => $events,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function create()
    {
        $teachers = User::whereHas('role', fn($q) => $q->where('name', 'teacher'))
            ->orderBy('full_name')
            ->get();

        $classrooms = Classroom::orderBy('level')
            ->orderBy('name')
            ->get();

        return Inertia::render('events/form', [
            'teachers' => $teachers,
            'classrooms' => $classrooms,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'description' => 'nullable|string',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'start_hour' => 'required|date_format:H:i',
                'end_hour' => 'required|date_format:H:i|after:start_hour',
                'pics' => 'required|array|min:1',
                'pics.*.id' => 'required|exists:users,id',
                'selected_students' => 'required|array|min:1',
                'selected_students.*' => 'exists:students,id',
            ]);

            DB::transaction(function () use ($validated) {
                $event = Event::create([
                    'name' => $validated['name'],
                    'description' => $validated['description'],
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                    'start_hour' => $this->formatTimeForDatabase($validated['start_hour']),
                    'end_hour' => $this->formatTimeForDatabase($validated['end_hour']),
                ]);

                // Attach PICS
                foreach ($validated['pics'] as $pic) {
                    EventPic::create([
                        'event_id' => $event->id,
                        'pic_id' => $pic['id'],
                    ]);
                }

                // Attach Participants
                foreach ($validated['selected_students'] as $studentId) {
                    EventParticipant::create([
                        'event_id' => $event->id,
                        'student_id' => $studentId,
                    ]);
                }
            });

            return redirect()->route('events.index')
                ->with('success', 'Kegiatan berhasil ditambahkan');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan kegiatan: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function edit(Event $event)
    {
        $today = now()->format('Y-m-d');
        $currentTime = now()->format('H:i');
        $eventStartHour = $this->formatTimeForDisplay($event->start_hour);

        if ($event->start_date < $today || ($event->start_date === $today && $eventStartHour <= $currentTime)) {
            return redirect()->route('events.index')
                ->with('error', 'Cannot update event that has already started or passed');
        }

        $event->load(['eventPics.user', 'participants']);

        $teachers = User::whereHas('role', fn($q) => $q->where('name', 'teacher'))
            ->orderBy('full_name')
            ->get();

        $classrooms = Classroom::orderBy('level')
            ->orderBy('name')
            ->get();

        $selectedStudents = $event->participants->pluck('student_id')->toArray();

        return Inertia::render('events/form', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
                'start_hour' => $this->formatTimeForDisplay($event->start_hour),
                'end_hour' => $this->formatTimeForDisplay($event->end_hour),
                'pics' => $event->eventPics
                    ->filter(fn($pic) => $pic->user) // hanya ambil yang ada user
                    ->map(function ($pic) {
                        return [
                            'id' => $pic->id,
                            'user' => [
                                'id' => $pic->user->id,
                                'full_name' => $pic->user->full_name
                            ]
                        ];
                    })
                    ->values()
                    ->toArray(),
            ],
            'teachers' => $teachers,
            'classrooms' => $classrooms,
            'selectedStudents' => $selectedStudents,
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $today = now()->format('Y-m-d');
        $currentTime = now()->format('H:i');
        $eventStartHour = $this->formatTimeForDisplay($event->start_hour);

        if ($event->start_date < $today || ($event->start_date === $today && $eventStartHour <= $currentTime)) {
            return redirect()->route('events.index')
                ->with('error', 'Tidak dapat memperbarui kegiatan yang sudah dimulai atau berlalu');
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'description' => 'nullable|string',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'start_hour' => 'required|date_format:H:i',
                'end_hour' => 'required|date_format:H:i|after:start_hour',
                'pics' => 'required|array|min:1',
                'pics.*.id' => 'required|exists:users,id',
                'selected_students' => 'required|array|min:1',
                'selected_students.*' => 'exists:students,id',
            ]);

            DB::transaction(function () use ($event, $validated) {
                $event->update([
                    'name' => $validated['name'],
                    'description' => $validated['description'],
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                    'start_hour' => $this->formatTimeForDatabase($validated['start_hour']),
                    'end_hour' => $this->formatTimeForDatabase($validated['end_hour']),
                ]);

                // Sync PICS
                $event->eventPics()->delete();
                foreach ($validated['pics'] as $pic) {
                    EventPic::create([
                        'event_id' => $event->id,
                        'pic_id' => $pic['id'],
                    ]);
                }

                // Sync Participants
                $event->participants()->delete();
                foreach ($validated['selected_students'] as $studentId) {
                    EventParticipant::create([
                        'event_id' => $event->id,
                        'student_id' => $studentId,
                    ]);
                }
            });

            return redirect()->route('events.index')
                ->with('success', 'Kegiatan berhasil diperbarui');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui kegiatan: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy(Event $event)
    {
        $today = now()->format('Y-m-d');
        $currentTime = now()->format('H:i');
        $eventStartHour = $this->formatTimeForDisplay($event->start_hour);

        if ($event->start_date < $today || ($event->start_date === $today && $eventStartHour <= $currentTime)) {
            return redirect()->route('events.index')
                ->with('error', 'Tidak dapat menghapus kegiatan yang sudah dimulai atau berlalu');
        }

        try {
            $event->delete();
            return redirect()->back()
                ->with('success', 'Kegiatan berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menghapus kegiatan: ' . $e->getMessage());
        }
    }
}
