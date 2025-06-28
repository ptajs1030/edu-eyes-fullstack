<?php

namespace App\Http\Controllers;

use App\Models\Shifting;
use Illuminate\Http\Request;
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
}
