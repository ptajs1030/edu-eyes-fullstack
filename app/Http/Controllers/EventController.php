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
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    private function formatTime($time)
    {
        return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
    }

    public function index(Request $request): Response
    {
        $events = Event::query()
            ->with(['eventPics.user'])
            ->withCount('participants')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'start_date', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        $events->getCollection()->transform(function ($event) {
            return [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
                'start_hour' => $this->formatTime($event->start_hour),
                'end_hour' => $this->formatTime($event->end_hour),
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
            // dd($request);
            Log::info('Incoming Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'headers' => $request->headers->all(),
                'body' => $request->except(['password', 'token']), // Hindari data sensitif
            ]);


            $validated = $request->validate([
                'name' => 'required|string|max:100',
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
                    'start_hour' => $validated['start_hour'],
                    'end_hour' => $validated['end_hour'],
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
                ->with('success', 'Event created successfully');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create event: ' . $e->getMessage())
                ->withInput();
        }
    }
}
