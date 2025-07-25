<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Announcement;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $announcements = Announcement::query()
        ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
        ->when($request->sort, fn($q) => $q->orderBy($request->sort, $request->direction ?? 'asc'))
        ->paginate(5)
        ->withQueryString(); // penting agar search & sort tetap saat ganti page

        return Inertia::render('announcement', [
            'filters' => $request->only(['search', 'sort', 'direction']),
            'announcements' => $announcements,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'short_content' => 'required|string'
        ]);

        $data = $request->all();

        Announcement::create($data);

        return redirect()->route('announcements.index')->with('success', 'Announcement created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Announcement $announcement)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'short_content' => 'required|string'
        ]);

        $data = $request->all();
        $announcement->update($data);

        return redirect()->route('announcements.index')->with('success', 'Announcement updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            Announcement::destroy($id);
            return redirect()->route('announcements.index')->with('success', 'Announcement deleted successfully.');
        } catch (\Throwable $th) {
            return redirect()->route('announcements.index')->with('error', 'Failed to delete announcement: ' . $th->getMessage());
        }
    }
}
