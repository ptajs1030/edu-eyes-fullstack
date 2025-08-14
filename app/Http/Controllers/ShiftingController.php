<?php

namespace App\Http\Controllers;

use App\Models\Shifting;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShiftingController extends Controller
{
    private function formatTime($time)
    {
        return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
    }

    public function index(Request $request): Response
    {
        $shiftings = Shifting::query()
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'start_hour', $request->direction ?? 'asc')
            ->paginate(10)
            ->through(function ($shifting) {
                return [
                    'id' => $shifting->id,
                    'name' => $shifting->name,
                    'start_hour' => $this->formatTime($shifting->start_hour),
                    'end_hour' => $this->formatTime($shifting->end_hour),
                ];
            })
            ->withQueryString();

        return Inertia::render('shiftings/index', [
            'shiftings' => $shiftings,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'start_hour' => 'required|date_format:H:i',
                'end_hour' => 'required|date_format:H:i|after:start_hour',
            ]);

            Shifting::create($validated);

            return redirect()->back()
                ->with('success', 'New shifting successfully added.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create shifting: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $shifting = Shifting::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'start_hour' => 'required|date_format:H:i',
                'end_hour' => 'required|date_format:H:i|after:start_hour',
            ]);

            $shifting->update($validated);

            return redirect()->back()
                ->with('success', 'Shifting updated successfully');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update shifting: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $shifting = Shifting::findOrFail($id);
            $shifting->delete();

            return redirect()->back()
                ->with('success', 'Shifting deleted successfully');
        } catch (QueryException $e) {
            if ($e->getCode() === "23000") {
                return redirect()->back()
                    ->with('error', 'Tidak dapat menghapus shifting karena digunakan dalam jadwal kelas.');

                return redirect()->back()
                    ->with('error', app()->environment('production')
                        ? 'Gagal menghapus shifting.'
                        : 'Gagal menghapus shifting: ' . $e->getMessage());
            }
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', app()->environment('production')
                    ? 'Failed to delete shifting'
                    : 'Failed to delete shifting: ' . $e->getMessage());
        }
    }
}
