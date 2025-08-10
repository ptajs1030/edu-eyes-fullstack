<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use DOMDocument;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $announcements = Announcement::query()
            ->with('attachments')
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'updated_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString(); // penting agar search & sort tetap saat ganti page

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function show($id)
    {
        $announcement = Announcement::with('attachments')->findOrFail($id);
        return Inertia::render('announcements/detail', [
            'announcement' => $announcement,
        ]);
    }

    public function create()
    {
        return Inertia::render('announcements/create');
    }

    public function store(Request $request)
    {
        $validator = $this->validateRequest($request);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $validated = $validator->validated();
            $content = $this->processContentImages($validated['content']);

            $announcement = Announcement::create([
                'title' => $validated['title'],
                'short_content' => $validated['short_content'],
                'content' => $content,
            ]);

            $this->handleAttachments($announcement->id, $validated['attachments'] ?? []);

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

    public function edit(Announcement $announcement): Response
    {
        $announcement->load('attachments');

        return Inertia::render('announcements/edit', [
            'announcement' => $announcement,
        ]);
    }


    public function update(Request $request, $id)
    {
        try {
            $validator = $this->validateRequest($request);

            if ($validator->fails()) {
                return redirect()->back()
                    ->withErrors($validator)
                    ->withInput();
            }

            $announcement = Announcement::findOrFail($id);
            $oldContent = $announcement->content;
            $validated = $validator->validated();

            $content = $this->processContentImages(
                $validated['content'],
                $oldContent
            );

            $announcement->update([
                'title' => $validated['title'],
                'short_content' => $validated['short_content'],
                'content' => $content,
            ]);

            // Sync attachments
            $this->handleAttachments($announcement->id, $validated['attachments'] ?? []);

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

    private function processContentImages($newContent, $oldContent = null)
    {
        $dom = new DOMDocument();
        @$dom->loadHTML($newContent, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

        // Get images from old content if exists
        $oldImages = [];
        if ($oldContent) {
            $oldDom = new DOMDocument();
            @$oldDom->loadHTML($oldContent, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            foreach ($oldDom->getElementsByTagName('img') as $img) {
                $src = $img->getAttribute('src');
                if ($src && !str_starts_with($src, 'data:')) {
                    $oldImages[] = $src;
                }
            }
        }

        // Process new images (base64)
        foreach ($dom->getElementsByTagName('img') as $img) {
            $src = $img->getAttribute('src');

            if (str_starts_with($src, 'data:image')) {
                try {
                    $imageData = $this->saveBase64Image($src);
                    $img->setAttribute('src', $imageData['url']);
                } catch (\Exception $e) {
                    continue;
                }
            }
        }

        // Delete unused images from old content
        if ($oldContent) {
            $currentImages = [];
            foreach ($dom->getElementsByTagName('img') as $img) {
                $currentImages[] = $img->getAttribute('src');
            }

            $imagesToDelete = array_diff($oldImages, $currentImages);
            $this->deleteImages($imagesToDelete);
        }

        return $dom->saveHTML();
    }

    private function saveBase64Image($base64)
    {
        if (!is_string($base64)) {
            throw new \Exception('Invalid base64 image data');
        }

        if (!preg_match('/^data:image\/(\w+);base64,/', $base64, $matches)) {
            throw new \Exception('Invalid base64 image format');
        }

        $imageType = $matches[1]; // jpeg, png, etc
        $imageData = substr($base64, strpos($base64, ',') + 1);
        $imageData = str_replace(' ', '+', $imageData);
        $decodedImage = base64_decode($imageData, true);

        if ($decodedImage === false) {
            throw new \Exception('Failed to decode base64 image');
        }

        $folder = 'uploads/announcement-images/';
        $filename = Str::random(40) . '.' . $imageType;
        $path = $folder . $filename;

        if (!Storage::disk('public')->put($path, $decodedImage)) {
            throw new \Exception('Failed to save image to storage');
        }

        return [
            'url' => Storage::url($path),
            'path' => $path
        ];
    }

    private function deleteImages($imageUrls)
    {
        foreach ($imageUrls as $url) {
            $path = str_replace(Storage::url(''), '', $url);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function handleAttachments($announcementId, $attachments)
    {
        AnnouncementAttachment::where('announcement_id', $announcementId)->delete();
        
        foreach ($attachments as $attachment) {
            AnnouncementAttachment::create([
                'announcement_id' => $announcementId,
                'url' => $attachment['url']
            ]);
        }
    }

    private function validateRequest(Request $request)
    {
        return Validator::make($request->all(), [
            'title' => 'required|string|max:70',
            'short_content' => 'required|string|max:255',
            'content' => 'required|string',
            'attachments' => 'nullable|array',
            'attachments.*.url' => 'required|url',
        ]);
    }
    
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
