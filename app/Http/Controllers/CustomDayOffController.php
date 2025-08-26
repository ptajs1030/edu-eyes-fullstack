<?php

namespace App\Http\Controllers;

use App\Models\CustomDayOff;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomDayOffController extends Controller
{
    public function index(Request $request): Response
    {
        $customDayOffs = CustomDayOff::query()
            ->when($request->search, fn($q) => $q->where('description', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'date', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('custom-day-offs/index', [
            'customDayOffs' => $customDayOffs,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date|after_or_equal:today|unique:custom_day_offs,date',
                'description' => 'required|string|max:255',
            ]);

            CustomDayOff::create($validated);

            return redirect()->back()
                ->with('success', 'Hari libur berhasil ditambahkan.');
        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan hari libur: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, CustomDayOff $customDayOff)
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date|after_or_equal:today|unique:custom_day_offs,date,' . $customDayOff->id,
                'description' => 'required|string|max:255',
            ]);

            $customDayOff->update($validated);

            return redirect()->back()
                ->with('success', 'Hari libur berhasil diperbarui.');
        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui hari libur: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function searchDayOff(Request $request)
    {
        $request->validate([
            'query' => 'nullable|string'
        ]);

        $query = $request->input('query', '');

        return CustomDayOff::when($query, function ($q) use ($query) {
            $q->where('description', 'like', "%{$query}%");
        })
            ->limit(10)
            ->get(['id', 'description as full_name']);
    }
}
