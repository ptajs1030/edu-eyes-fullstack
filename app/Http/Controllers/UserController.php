<?php

namespace App\Http\Controllers;

use App\Enums\Role as EnumsRole;
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
    private function getValidationRules(EnumsRole $role, ?User $user): array
    {
        $rules = [
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username' . ($user ? ",{$user->id}" : ''),
            'phone' => 'nullable|string|max:20|unique:users,phone' . ($user ? ",{$user->id}" : ''),
            'email' => 'nullable|email|max:255|unique:users,email' . ($user ? ",{$user->id}" : ''),
            'address' => 'nullable|string',
            'status' => 'required|in:' . implode(',', UserStatus::getValues()),
        ];

        if (!$user) {
            $rules['password'] = 'required|string|min:8|confirmed';
        } else {
            $rules['password'] = 'nullable|string|min:8|confirmed';
        }

        // Role-specific rules
        if ($role === EnumsRole::Admin || $role === EnumsRole::Teacher) {
            $rules['nip'] = 'nullable|string|max:255';
            $rules['position'] = 'nullable|string|max:255';
        }

        if ($role === EnumsRole::Parent) {
            $rules['job'] = 'nullable|string|max:255';
        }

        return $rules;
    }

    private function prepareUserData(array $validated, EnumsRole $role): array
    {
        $data = [
            'full_name' => $validated['full_name'],
            'username' => $validated['username'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'status' => $validated['status'],
        ];

        if (isset($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        // Role-specific data
        if ($role === EnumsRole::Admin || $role === EnumsRole::Teacher) {
            $data['nip'] = $validated['nip'] ?? null;
            $data['position'] = $validated['position'] ?? null;
        }

        if ($role === EnumsRole::Parent) {
            $data['job'] = $validated['job'] ?? null;
        }

        return $data;
    }

    public function indexAdmin(Request $request): Response
    {
        return $this->indexByRole($request, EnumsRole::Admin);
    }

    public function indexTeacher(Request $request): Response
    {
        return $this->indexByRole($request, EnumsRole::Teacher);
    }

    public function indexParent(Request $request): Response
    {
        return $this->indexByRole($request, EnumsRole::Parent);
    }

    private function indexByRole(Request $request, EnumsRole $role): Response
    {
        $statuses = collect(UserStatus::cases())->map(fn($status) => [
            'value' => $status->value,
            'label' => $status->label(),
        ]);

        $users = User::with('role')
            ->whereHas('role', fn($q) => $q->where('name', $role->value))
            ->when($request->search, fn($q) => $q->where('full_name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'id', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render("users/{$role->value}/index", [
            'users' => $users,
            'statuses' => $statuses,
            'filters' => $request->only(['search', 'sort', 'direction']),
            'role' => [
                'id' => Role::where('name', $role->value)->first()->id,
                'name' => $role->label(),
                'value' => $role->value,
            ],
        ]);
    }

    public function storeAdmin(Request $request)
    {
        return $this->storeByRole($request, EnumsRole::Admin);
    }

    public function storeTeacher(Request $request)
    {
        return $this->storeByRole($request, EnumsRole::Teacher);
    }

    public function storeParent(Request $request)
    {
        return $this->storeByRole($request, EnumsRole::Parent);
    }

    private function storeByRole(Request $request, EnumsRole $role)
    {
        try {
            $roleModel = Role::where('name', $role->value)->firstOrFail();

            $validationRules = $this->getValidationRules($role, null);

            $validated = $request->validate($validationRules);

            $userData = $this->prepareUserData($validated, $role);
            $userData['role_id'] = $roleModel->id;

            User::create($userData);

            return redirect()->back()->with('success', "New {$role->label()} created successfully");
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

    public function updateAdmin(Request $request, User $user)
    {
        return $this->updateByRole($request, $user, EnumsRole::Admin);
    }

    public function updateTeacher(Request $request, User $user)
    {
        return $this->updateByRole($request, $user, EnumsRole::Teacher);
    }

    public function updateParent(Request $request, User $user)
    {
        return $this->updateByRole($request, $user, EnumsRole::Parent);
    }

    private function updateByRole(Request $request, User $user, EnumsRole $role)
    {
        try {
            $validationRules = $this->getValidationRules($role, $user);

            $validated = $request->validate($validationRules);

            $userData = $this->prepareUserData($validated, $role);

            $user->update($userData);

            return redirect()->back()->with('success', "{$role->label()} updated successfully");
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
