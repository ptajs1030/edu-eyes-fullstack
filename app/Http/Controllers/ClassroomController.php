<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Models\AcademicYear;
use App\Models\ClassHistory;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\ClassShiftingSchedule;
use App\Models\ClassSubjectSchedule;
use App\Models\ShiftingAttendance;
use App\Models\SubjectAttendance;
use App\Models\ExamAssignment;
use App\Models\TaskAssignment;
use App\Models\TemporaryClassStatus;
use App\Models\TemporaryClassStudent;
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
            ->when($request->sort, function ($q) use ($request) {
                // if sort param exists → use it
                $q->orderBy($request->sort, $request->direction ?? 'asc');
            }, function ($q) use ($request) {
                // if sort param does NOT exist → fallback to level + name
                $q->orderBy('level', $request->direction ?? 'asc')
                ->orderBy('name', $request->direction ?? 'asc');
            })
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
                'name' => 'required|string|max:70',
                'level' => 'required|integer|min:1',
                'main_teacher_id' => 'nullable|exists:users,id',
            ]);

            $existingClassroom = Classroom::where('name', $validated['name'])->first();

            if ($existingClassroom) {
                throw ValidationException::withMessages([
                    'name' => 'Nama kelas sudah digunakan. Silakan gunakan nama lain.'
                ]);
            }

            Classroom::create($validated);

            return redirect()->back()
                ->with('success', 'Kelas baru berhasil ditambahkan.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan kelas: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $classroom = Classroom::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'level' => 'required|integer|min:1',
                'main_teacher_id' => 'nullable|exists:users,id',
            ]);

            $existingClassroom = Classroom::where('name', $validated['name'])
                ->where('id', '!=', $classroom->id)
                ->first();

            if ($existingClassroom) {
                throw ValidationException::withMessages([
                    'name' => 'Nama kelas sudah digunakan oleh kelas lain. Silakan gunakan nama lain.'
                ]);
            }

            $classroom->update($validated);

            return redirect()->back()
                ->with('success', 'Kelas berhasil diperbarui.');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui kelas: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            // 1. Check active students in class
            $hasActiveStudents = Student::where('class_id', $id)->exists();

            if ($hasActiveStudents) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena masih memiliki siswa aktif.');
            }

            // 2. Check class histories linked to active students
            $hasClassHistory = ClassHistory::where('class_id', $id)
                ->whereHas('student', function ($query) {
                    $query->whereNull('deleted_at');
                })
                ->exists();

            if ($hasClassHistory) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena memiliki riwayat kelas dari siswa aktif.');
            }

            // 3. Check class shifting schedules
            $hasClassShiftingSchedule = ClassShiftingSchedule::where('class_id', $id)->exists();

            if ($hasClassShiftingSchedule) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena memiliki jadwal shifting.');
            }

            // 4. Check class subject schedules
            $hasClassSubjectSchedule = ClassSubjectSchedule::where('class_id', $id)->exists();

            if ($hasClassSubjectSchedule) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena memiliki jadwal pelajaran.');
            }

            // 5. Check shifting attendances
            $hasShiftingAttendance = ShiftingAttendance::where('class_id', $id)->exists();

            if ($hasShiftingAttendance) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena memiliki data absensi shifting.');
            }

            // 6. Check subject attendances
            $hasSubjectAttendance = SubjectAttendance::where('class_id', $id)->exists();

            if ($hasSubjectAttendance) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena memiliki data absensi mata pelajaran.');
            }

            // 7. Check active exam assignments
            $hasExamAssignment = ExamAssignment::where('class_id', $id)
                ->whereHas('exam', function ($query) {
                    $query->whereNull('deleted_at');
                })
                ->exists();

            if ($hasExamAssignment) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena telah melaksanakan ujian aktif.');
            }

            // 8. Check active task assignments
            $hasTaskAssignment = TaskAssignment::where('class_id', $id)
                ->whereHas('task', function ($query) {
                    $query->whereNull('deleted_at');
                })
                ->exists();

            if ($hasTaskAssignment) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena telah diberikan tugas aktif.');
            }

            // 9. Check temporary class statuses
            $hasTemporaryStatus = TemporaryClassStatus::where('class_id', $id)->exists();

            if ($hasTemporaryStatus) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena terdata di status kelas sementara.');
            }

            // 10. Check temporary class students
            $hasTemporaryStudent = TemporaryClassStudent::where('initial_class_id', $id)
                ->orWhere('target_class_id', $id)
                ->exists();

            if ($hasTemporaryStudent) {
                return redirect()->back()->with('error', 'Kelas tidak dapat dihapus karena terdata di perpindahan siswa sementara.');
            }

            $classroom = Classroom::findOrFail($id);
            $classroom->delete();

            return redirect()->back()
                ->with('success', 'Kelas berhasil dihapus');
        } catch (\Exception $e) {
            $errorMessage = 'Gagal menghapus kelas';

            // Check if it's a foreign key constraint violation
            if (
                str_contains($e->getMessage(), 'Integrity constraint violation') &&
                str_contains($e->getMessage(), 'foreign key constraint')
            ) {
                $errorMessage = 'Kelas tidak dapat dihapus karena masih dipakai di data lain.';
            } else if (!app()->environment('production')) {
                $errorMessage .= ': ' . $e->getMessage();
            }

            return redirect()->back()
                ->with('error', $errorMessage);
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
            $classroom = Classroom::with(['students' => function ($query) {
                $query->select('id', 'full_name', 'nis', 'class_id')
                    ->where('status', 'active');
            }])->findOrFail($id);

            $students = $classroom->students->map(function ($student) use ($classroom) {
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
