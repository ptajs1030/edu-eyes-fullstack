<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $roles = Role::query()
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'id', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:70|unique:roles,name',
            ]);
            $validated['name'] = strtolower($validated['name']);

            Role::create($validated);

            return redirect()->back()
                ->with('success', 'Role baru berhasil ditambahkan.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan role: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $role = Role::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:70|unique:roles,name,' . $role->id,
            ]);
            $validated['name'] = strtolower($validated['name']);

            $role->update($validated);

            return redirect()->back()
                ->with('success', 'Role berhasil diperbarui');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui role: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $role = Role::findOrFail($id);
            $role->delete();

            return redirect()->back()
                ->with('success', 'Role berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', app()->environment('production')
                    ? 'Gagal menghapus role'
                    : 'Gagal menghapus role: ' . $e->getMessage());
        }
    }
}
