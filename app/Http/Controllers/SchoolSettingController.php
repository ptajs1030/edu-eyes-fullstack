<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolSettingController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = Setting::query()
            ->when($request->search, fn($q) => $q->where('key', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('school-settings/index', [
            'settings' => $settings,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $setting = Setting::findOrFail($id);

            $validated = $request->validate([
                'value' => 'required|string',
            ]);

            $setting->update($validated);

            return redirect()->back()
                ->with('success', 'Setting updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update setting: ' . $e->getMessage())
                ->withInput();
        }
    }
}
