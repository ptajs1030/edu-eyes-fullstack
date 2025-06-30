<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Models\AcademicYear;
use App\Models\Classroom;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomController extends Controller
{
    public function index(Request $request): Response
    {
        $classrooms = Classroom::with('mainTeacher')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'level', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('classrooms/index', [
            'classrooms' => $classrooms,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function show(Request $request, $id): Response
    {
        $classroom = Classroom::with(['mainTeacher', 'students' => function ($query) use ($request) {
            // Sorting untuk relasi students
            $sort = $request->sort ?? 'full_name';
            $direction = $request->direction ?? 'asc';

            $query->with('parent')
                ->when($request->sort === 'parent', function ($q) use ($direction) {
                    $q->join('users', 'students.parent_id', '=', 'users.id')
                        ->orderBy('users.full_name', $direction)
                        ->select('students.*');
                })
                ->when($request->sort !== 'parent', function ($q) use ($sort, $direction) {
                    $q->orderBy($sort, $direction);
                });
        }])
            ->withCount('students')
            ->findOrFail($id);

        $academicYear = AcademicYear::where('status', 'active')->first();

        return Inertia::render('classrooms/detail', [
            'classroom' => $classroom,
            'academicYear' => $academicYear,
            'filters' => $request->only(['sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:classrooms,name',
                'level' => 'required|integer|min:1',
                'main_teacher_id' => 'required|exists:users,id',
            ]);

            Classroom::create($validated);

            return redirect()->back()
                ->with('success', 'New classroom successfully added.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create classroom: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $classroom = Classroom::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:classrooms,name,' . $classroom->id,
                'level' => 'required|integer|min:1',
                'main_teacher_id' => 'required|exists:users,id',
            ]);

            $classroom->update($validated);

            return redirect()->back()
                ->with('success', 'Classroom updated successfully');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->with('error', 'Validation error: ' . implode(' ', $e->validator->errors()->all()))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update classroom: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $classroom = Classroom::findOrFail($id);
            $classroom->delete();

            return redirect()->back()
                ->with('success', 'Classroom deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', app()->environment('production')
                    ? 'Failed to delete classroom'
                    : 'Failed to delete classroom: ' . $e->getMessage());
        }
    }
}
