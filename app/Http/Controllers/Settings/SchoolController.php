<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SchoolUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class SchoolController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $schoolName = Setting::where('key', 'school_name')->value('value');
        $schoolAddress = Setting::where('key', 'school_address')->value('value');
        $schoolLogo = Setting::where('key', 'school_logo')->value('value');

        $schoolLogoUrl = $schoolLogo ? asset('storage/' . $schoolLogo) : null;

        return Inertia::render('settings/school', [
            'school_name' => $schoolName,
            'school_address' => $schoolAddress,
            'school_logo' => $schoolLogoUrl,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(SchoolUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $directory = 'uploads/logos';

        // Handle logo upload
        if ($request->hasFile('school_logo')) {
            $logo = $request->file('school_logo');
            $filename = time() . '-' . uniqid() . '.jpg';
            $path = $directory . '/' . $filename;

            // crop square, 300 x 300
            $image = imagecreatefromstring(file_get_contents($logo->path()));
            $width = imagesx($image);
            $height = imagesy($image);
            $size = min($width, $height);

            $cropped = imagecreatetruecolor(300, 300);
            // Fill background with white color for transparent images
            $white = imagecolorallocate($cropped, 255, 255, 255);
            imagefill($cropped, 0, 0, $white);
            
            imagecopyresampled(
                $cropped,
                $image,
                0,
                0,
                ($width - $size) / 2,
                ($height - $size) / 2,
                300,
                300,
                $size,
                $size
            );

            // Simpan hasil crop
            ob_start();
            imagejpeg($cropped, null, 80);
            $imageData = ob_get_clean();
            Storage::disk('public')->put($path, $imageData);

            // Hapus resource
            imagedestroy($image);
            imagedestroy($cropped);

            // Delete old file if exists
            $oldLogo = Setting::where('key', 'school_logo')->value('value');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }

            // Update setting value with new path
            Setting::updateOrCreate(['key' => 'school_logo'], ['value' => $path]);
        }

        // Update other settings
        foreach (['school_name', 'school_address'] as $key) {
            if (isset($validated[$key])) {
                Setting::updateOrCreate(['key' => $key], ['value' => $validated[$key]]);
            }
        }

        return to_route('school.edit');
    }
}
