<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomController extends Controller
{
    public function index(Request $request): Response
    {
        $classrooms = Classroom::with('mainTeacher')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'name', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('classrooms/index', [
            'classrooms' => $classrooms,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }
}
