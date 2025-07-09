<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $statuses = collect(UserStatus::cases())->map(fn($status) => [
            'value' => $status->value,
            'label' => $status->label(),
        ]);

        $users = User::with('role')
            ->when($request->search, fn($q) => $q->where('full_name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'id', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => Role::all(['id', 'name']),
            'statuses' => $statuses,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function searchParents(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1'
        ]);

        $parents = User::whereHas('role', function ($query) {
            $query->where('name', 'parent');
        })
            ->where('full_name', 'like', '%' . $request->input('query') . '%')
            ->limit(10)
            ->get(['id', 'full_name']);

        return response()->json($parents);
    }

    public function searchTeachers(Request $request)
    {
        $request->validate([
            'query' => 'nullable|string'
        ]);

        $query = User::whereHas('role', function ($query) {
            $query->where('name', 'teacher');
        });

        if ($request->has('query') && $request->query('query') !== '') {
            $query->where('full_name', 'like', '%' . $request->query('query') . '%');
        }

        return $query->limit(10)->get();
    }
}
