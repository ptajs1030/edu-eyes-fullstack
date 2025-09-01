<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index (Request $request){
        $tasks= Task::query()
            ->with('attachments')
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('tasks/index',[
            'tasks' => $tasks,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }
}
