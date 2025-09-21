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
            ->where('key', 'not like', 'school\_%') // exclude school_ prefix
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
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
                ->with('success', 'Pengaturan berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui pengaturan: ' . $e->getMessage())
                ->withInput();
        }
    }
}
