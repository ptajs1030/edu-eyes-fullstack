<?php

namespace App\Http\Controllers;

use App\Enums\Religion;
use App\Enums\Sex;
use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        // Get enum
        $sexes = collect(Sex::cases())->map(fn($sex) => [
            'value' => $sex->value,
            'label' => $sex->label(),
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
            'religions' => $religions,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    // public function store(Request $request)
    // {
    //     $request->validate([
    //         'name' => 'required|string|max:255',
    //         'nis' => 'required|string|unique:students',
    //         'class_id' => 'nullable|exists:classrooms,id',
    //         // Tambahkan validasi lainnya
    //     ]);

    //     $student = Student::create($request->all());

    //     return redirect()->back()->with('success', 'Student created successfully');
    // }

    // public function update(Request $request, Student $student)
    // {
    //     $request->validate([
    //         'name' => 'required|string|max:255',
    //         'nis' => 'required|string|unique:students,nis,' . $student->id,
    //         'class_id' => 'nullable|exists:classrooms,id',
    //     ]);

    //     $student->update($request->all());

    //     return redirect()->back()->with('success', 'Student updated successfully');
    // }

    // public function destroy(Student $student)
    // {
    //     $student->delete();
    //     return redirect()->back()->with('success', 'Student deleted successfully');
    // }
}
