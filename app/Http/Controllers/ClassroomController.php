<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Models\AcademicYear;
use App\Models\ClassHistory;
use App\Models\Classroom;
use Carbon\Carbon;
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
                'name' => 'required|string|max:70|unique:classrooms,name',
                'level' => 'required|integer|min:1',
                'main_teacher_id' => 'nullable|exists:users,id',
            ]);

            Classroom::create($validated);

            return redirect()->back()
                ->with('success', 'New classroom successfully added.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
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
                'name' => 'required|string|max:70|unique:classrooms,name,' . $classroom->id,
                'level' => 'required|integer|min:1',
                'main_teacher_id' => 'nullable|exists:users,id',
            ]);

            $classroom->update($validated);

            return redirect()->back()
                ->with('success', 'Classroom updated successfully');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
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

    public function history(Classroom $classroom, Request $request)
    {
        $academicYears = AcademicYear::orderBy('start_year', 'desc')->get();

        // Get seleted academicYear or active academic year
        $selectedAcademicYearId = $request->input('academic_year');
        $academicYear = $selectedAcademicYearId
            ? AcademicYear::find($selectedAcademicYearId)
            : AcademicYear::where('status', AcademicYearStatus::Active->value)->first();

        $students = [];
        $studentCount = 0;
        if ($academicYear) {
            // Ambil data class histories dengan relasi
            $classHistories = ClassHistory::with(['student.parent'])
                ->where('academic_year_id', $academicYear->id)
                ->where('class_id', $classroom->id)
                ->get();

            // Format data untuk komponen Table
            $students = $classHistories
                ->filter(fn($history) => $history->student) // buang jika student null
                ->map(function ($history) use ($academicYear) {
                    $student = $history->student;
                    $birthDate = $student->date_of_birth;
                    $age = null;

                    // Hitung umur berdasarkan tahun akademik
                    if ($birthDate && $academicYear->start_year) {
                        $birthYear = Carbon::parse($birthDate)->year;
                        $age = $academicYear->start_year - $birthYear;
                    }

                    return [
                        'id' => $student->id,
                        'full_name' => $student->full_name,
                        'age' => $age,
                        'parent' => $student->parent ? [
                            'id' => $student->parent->id,
                            'full_name' => $student->parent->full_name,
                            'phone' => $student->parent->phone
                        ] : null
                    ];
                })
                ->values() // reset index 
                ->toArray();

            $studentCount = count($students);
        }

        return Inertia::render('classrooms/history', [
            'classroom' => $classroom,
            'academicYears' => $academicYears,
            'selectedAcademicYear' => $academicYear,
            'students' => $students,
            'studentCount' => $studentCount,
            'filters' => $request->only(['sort', 'direction']),
        ]);
    }

    public function getStudents($id)
    {
        try {
            $classroom = Classroom::with(['students' => function($query) {
                $query->select('id', 'full_name', 'nis', 'class_id')
                      ->where('status', 'active');
            }])->findOrFail($id);

            $students = $classroom->students->map(function($student) use ($classroom) {
                return [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'nis' => $student->nis,
                    'classroom' => [
                        'id' => $classroom->id,
                        'name' => $classroom->name
                    ]
                ];
            });

            return response()->json([
                'students' => $students
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Classroom not found'
            ], 404);
        }
    }
}
