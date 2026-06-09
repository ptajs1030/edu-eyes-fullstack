<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
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

    public function generateShifting()
    {
        try {
            Artisan::call('attendance:generate-shifting', ['--force' => true]);
            $output = Artisan::output();
            return response()->json([
                'success' => true,
                'message' => 'Generate absensi shifting selesai!',
                'output' => trim($output)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate absensi shifting: ' . $e->getMessage(),
                'output' => $e->getMessage()
            ], 500);
        }
    }

    public function generateEvent()
    {
        try {
            Artisan::call('attendance:generate-event', ['--force' => true]);
            $output = Artisan::output();
            return response()->json([
                'success' => true,
                'message' => 'Generate absensi kegiatan selesai!',
                'output' => trim($output)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate absensi kegiatan: ' . $e->getMessage(),
                'output' => $e->getMessage()
            ], 500);
        }
    }

    public function checkPaymentDeadlines()
    {
        try {
            Artisan::call('check:payment-deadlines', ['--force' => true]);
            $output = Artisan::output();
            return response()->json([
                'success' => true,
                'message' => 'Cek deadline pembayaran selesai!',
                'output' => trim($output)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal cek deadline pembayaran: ' . $e->getMessage(),
                'output' => $e->getMessage()
            ], 500);
        }
    }

    public function checkTaskDeadlines()
    {
        try {
            Artisan::call('check:task-deadlines', ['--force' => true]);
            $output = Artisan::output();
            return response()->json([
                'success' => true,
                'message' => 'Cek deadline tugas selesai!',
                'output' => trim($output)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal cek deadline tugas: ' . $e->getMessage(),
                'output' => $e->getMessage()
            ], 500);
        }
    }
}
