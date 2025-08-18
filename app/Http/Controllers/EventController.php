<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;
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
}
