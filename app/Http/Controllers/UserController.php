<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'username' => 'required|string|max:255|unique:users,username',
                'phone' => 'nullable|string|unique:users,phone',
                'email' => 'nullable|email|max:255|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'role_id' => 'required|exists:roles,id',
                'status' => 'required|in:' . implode(',', UserStatus::getValues()),
            ]);

            User::create([
                'full_name' => $validated['full_name'],
                'username' => $validated['username'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'password' => Hash::make($validated['password']),
                'role_id' => $validated['role_id'],
                'status' => $validated['status'],
            ]);

            return redirect()->back()
                ->with('success', 'New user successfully added.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create user: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validationRules = [
                'full_name' => 'required|string|max:255',
                'username' => 'required|string|max:255|unique:users,username,' . $user->id,
                'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
                'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
                'role_id' => 'required|exists:roles,id',
                'status' => 'required|in:' . implode(',', UserStatus::getValues()),
            ];

            if ($request->password) {
                $validationRules['password'] = 'string|min:8|confirmed';
            }

            $validated = $request->validate($validationRules);

            $updateData = [
                'full_name' => $validated['full_name'],
                'username' => $validated['username'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'role_id' => $validated['role_id'],
                'status' => $validated['status'],
            ];

            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $user->update($updateData);

            return redirect()->back()
                ->with('success', 'User updated successfully');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update user: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            return redirect()->back()
                ->with('success', 'User deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', app()->environment('production')
                    ? 'Failed to delete user'
                    : 'Failed to delete user: ' . $e->getMessage());
        }
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
