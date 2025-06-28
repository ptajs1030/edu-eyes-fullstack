<?php

namespace App\Http\Controllers;

use App\Enums\Religion;
use App\Enums\Sex;
use App\Enums\StudentStatus;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function searchParents(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2'
        ]);

        $parents = User::whereHas('role', function ($query) {
            $query->where('name', 'parent');
        })
            ->where('full_name', 'like', '%' . $request->input('query') . '%')
            ->limit(10)
            ->get(['id', 'full_name']);

        return response()->json($parents);
    }

    public function index(Request $request): Response
    {
        // Get enum
        $sexes = collect(Sex::cases())->map(fn($sex) => [
            'value' => $sex->value,
            'label' => $sex->label(),
        ]);
        $statuses = collect(StudentStatus::cases())->map(fn($status) => [
            'value' => $status->value,
            'label' => $status->label(),
        ]);
        $religions = collect(Religion::cases())->map(fn($religion) => [
            'value' => $religion->value,
            'label' => $religion->label(),
        ]);

        $students = Student::with(['classroom', 'parent'])
            ->when($request->search, fn($q) => $q->where('full_name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('students/index', [
            'students' => $students,
            'classrooms' => Classroom::all(),
            'sexes' => $sexes,
            'statuses' => $statuses,
            'religions' => $religions,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'required|exists:users,id',
                'class_id' => 'nullable|exists:classrooms,id',
                'full_name' => 'required|string|max:255',
                'code' => 'nullable|string|unique:students,code',
                'entry_year' => 'required|digits:4|integer|min:1900|max:' . (date('Y') + 1),
                'gender' => 'required|in:' . implode(',', Sex::getValues()),
                'status' => 'required|in:' . implode(',', StudentStatus::getValues()),
                'religion' => 'required|string|max:255',
                'birth_place' => 'required|string|max:255',
                'date_of_birth' => 'required|date',
                'address' => 'required|string',
            ]);

            // Default status active jika tidak diset
            $validated['status'] = $validated['status'] ?? StudentStatus::Active->value;

            Student::create($validated);

            return redirect()
                ->back()
                ->with('success', 'Student created successfully')
                ->with('queryParams', $request->query());
        } catch (ValidationException $e) {
            return redirect()
                ->back()
                ->withErrors($e->validator)
                ->with('toast', [
                    'type' => 'error',
                    'message' => 'Validation error: ' . implode(' ', $e->validator->errors()->all())
                ])
                ->withInput();
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('toast', [
                    'type' => 'error',
                    'message' => 'Failed to create student: ' . $e->getMessage()
                ])
                ->withInput();
        }
    }

    public function update(Request $request, Student $student)
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'required|exists:users,id',
                'class_id' => 'nullable|exists:classrooms,id',
                'full_name' => 'required|string|max:255',
                'code' => 'nullable|string|unique:students,code',
                'entry_year' => 'required|digits:4|integer|min:1900|max:' . (date('Y') + 1),
                'gender' => 'required|in:' . implode(',', Sex::getValues()),
                'status' => 'required|in:' . implode(',', StudentStatus::getValues()),
                'religion' => 'required|string|max:255',
                'birth_place' => 'required|string|max:255',
                'date_of_birth' => 'required|date',
                'address' => 'required|string',
            ]);

            $student->update($validated);

            return redirect()->back()->with('success', 'Student updated successfully');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Failed to update student: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $student = Student::findOrFail($id);
            $student->delete();

            return redirect()
                ->route('students.index')
                ->with('success', 'Student deleted successfully');
        } catch (\Exception $e) {
            // if it's production environment, don't show detailed error
            return redirect()
                ->back()
                ->with('error', app()->environment('production') ? 'Failed to delete student' : 'Failed to delete student: ' . $e->getMessage());
        }
    }
}
