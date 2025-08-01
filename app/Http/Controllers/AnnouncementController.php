<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Announcement;
use Illuminate\Validation\ValidationException;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $announcements = Announcement::query()
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString(); // penting agar search & sort tetap saat ganti page

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function create()
    {
        return Inertia::render('announcements/create');
    }

    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'title' => 'required|string|max:70',
                'short_content' => 'required|string|max:255',
                'content' => 'required|string',
                'attachments' => 'nullable|array',
                'attachments.*.url' => 'required|url',
            ]);

            $announcement = Announcement::create([
                'title' => $validated['title'],
                'short_content' => $validated['short_content'],
                'content' => $validated['content'],
            ]);

            if (!empty($validated['attachments'])) {
                foreach ($validated['attachments'] as $attachment) {
                    $announcement->attachments()->create([
                        'url' => $attachment['url'],
                    ]);
                }
            }

            return redirect()->route('announcements.index')->with('success', 'Announcement created successfully.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validasi gagal: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal membuat pengumuman: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function edit($id)
    {
        $announcement = Announcement::with('attachments')->findOrFail($id);
        return Inertia::render('announcements/edit', [
            'announcement' => $announcement,
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $announcement = Announcement::findOrFail($id);

            $validated = $request->validate([
                'title' => 'required|string|max:70',
                'short_content' => 'required|string|max:255',
                'content' => 'required|string',
                'attachments' => 'nullable|array',
                'attachments.*.url' => 'required|url',
            ]);

            $announcement->update([
                'title' => $validated['title'],
                'short_content' => $validated['short_content'],
                'content' => $validated['content'],
            ]);

            // Sync attachments
            $announcement->attachments()->delete();
            if (!empty($validated['attachments'])) {
                foreach ($validated['attachments'] as $attachment) {
                    $announcement->attachments()->create([
                        'url' => $attachment['url'],
                    ]);
                }
            }

            return redirect()->route('announcements.index')->with('success', 'Announcement updated successfully.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validasi gagal: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui pengumuman: ' . $e->getMessage())
                ->withInput();
        }
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
