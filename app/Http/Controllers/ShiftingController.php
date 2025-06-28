<?php

namespace App\Http\Controllers;

use App\Models\Shifting;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShiftingController extends Controller
{
    public function index(Request $request): Response
    {
        $shiftings = Shifting::query()
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
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
                'name' => 'required|string|max:255',
                'start_hour' => 'required|date_format:H:i',
                'end_hour' => 'required|date_format:H:i|after:start_hour',
            ]);

            Shifting::create($validated);

            return redirect()->back()
                ->with('success', 'New shifting successfully added.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create shifting: ' . $e->getMessage())
                ->withInput();
        }
    }
}
