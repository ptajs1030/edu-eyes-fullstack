<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SchoolUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Setting;

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

        // Handle logo upload
        if ($request->hasFile('school_logo')) {
            $logo = $request->file('school_logo');

            // Optional: delete old file
            $oldLogo = Setting::where('key', 'school_logo')->value('value');
            if ($oldLogo && \Storage::disk('public')->exists($oldLogo)) {
                \Storage::disk('public')->delete($oldLogo);
            }

            // Store new logo (e.g. in 'uploads/logos/')
            $path = $logo->store('uploads/logos', 'public');

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
