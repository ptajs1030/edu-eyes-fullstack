<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Enums\StudentStatus;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\TemporaryClassStatus;
use App\Models\TemporaryClassStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Response;
use Inertia\Inertia;

class GradePromotionController extends Controller
{
    private function getAcademicYear()
    {
        return AcademicYear::where('status', AcademicYearStatus::Active->value)->first();
    }

    public function populateData()
    {
        try {
            $currentAcademicYear = $this->getAcademicYear();
            if (!$currentAcademicYear || !$currentAcademicYear->id) {
                Log::error('Tahun akademik tidak ditemukan');
                throw new \Exception('Tahun akademik aktif tidak ditemukan');
            }

            $students = Student::where('status', StudentStatus::Active->value)
                ->whereNotNull('class_id')
                ->get();
            if ($students->isEmpty()) {
                Log::error('Tidak ada siswa aktif');
                throw new \Exception('Tidak ada siswa aktif yang ditemukan');
            }

            DB::transaction(function () use ($currentAcademicYear) {
                $classrooms = Classroom::with('students')->get();

                foreach ($classrooms as $class) {
                    foreach ($class->students as $student) {
                        TemporaryClassStudent::create([
                            'student_id' => $student->id,
                            'academic_year_id' => $currentAcademicYear->id,
                            'initial_class_id' => $student->class_id,
                            'target_class_id' => null,
                            'is_graduate' => false
                        ]);
                    }

                    $status = $class->students->isEmpty() ? 'completed' : 'draft';

                    TemporaryClassStatus::create([
                        'class_id' => $class->id,
                        'status' => $status,
                    ]);
                }
            });

            return redirect()->back()
                ->with('success', 'Data siswa berhasil dipopulate');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menginisialisasi data: ' . $e->getMessage());
        }
    }

    public function index(Request $request): Response
    {
        $attendanceModes = collect(AttendanceMode::cases())->map(fn($mode) => [
            'value' => $mode->value,
            'label' => $mode->label(),
        ]);

        $query = TemporaryClassStatus::query()
            ->with(['classroom' => function ($query) {
                $query->select('id', 'name', 'level');
            }])
            ->select(
                'class_id',
                'status',
                DB::raw('(SELECT COUNT(*) FROM temporary_class_students WHERE initial_class_id = temporary_class_statuses.class_id) as student_count')
            );

        $sort = $request->input('sort', 'level');
        $direction = $request->input('direction', 'asc');

        $validSorts = ['class_id', 'name', 'level', 'status'];
        $validDirections = ['asc', 'desc'];

        if (in_array($sort, $validSorts) && in_array($direction, $validDirections)) {
            if ($sort === 'name' || $sort === 'level') {
                $query->join('classrooms', 'temporary_class_statuses.class_id', '=', 'classrooms.id')
                    ->orderBy("classrooms.{$sort}", $direction);
            } else {
                $query->orderBy($sort, $direction);
            }
        }

        $classGroups = $query->get();
        $allCompleted = !TemporaryClassStatus::where('status', 'draft')->exists();

        return Inertia::render('grade-promotions/index', [
            'classGroups' => $classGroups,
            'nextAcademicYear' => $this->getAcademicYear()->start_year + 1,
            'allCompleted' => $allCompleted,
            'hasData' => $classGroups->isNotEmpty(),
            'attendanceModes' => $attendanceModes,
            'filters' => $request->only(['sort', 'direction']),
        ]);
    }

    public function showAssign($classId)
    {
        try {
            $currentClass = Classroom::findOrFail($classId);
            $highestLevel = Classroom::max('level');
            $isHighestLevel = $currentClass->level == $highestLevel;

            // get students in current class - students target_class_id === null
            $students = TemporaryClassStudent::with(['student' => fn($q) => $q->select('id', 'full_name', 'nis')])
                ->where('initial_class_id', $classId)
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'student_id' => $item->student_id,
                    'full_name' => $item->student->full_name,
                    'nis' => $item->student->nis,
                    'target_class_id' => $item->target_class_id,
                    'is_graduate' => $item->is_graduate
                ]);

            $targetClassOptions = Classroom::where(function ($query) use ($currentClass, $isHighestLevel) {
                $query->where('level', $currentClass->level) // Same level
                    ->orWhere('level', $isHighestLevel ? $currentClass->level : $currentClass->level + 1); // Next level or same if highest
            })
                ->select('id', 'name', 'level')
                ->get();

            $unassignedCount = TemporaryClassStudent::where('initial_class_id', $classId)
                ->whereNull('target_class_id')
                ->where('is_graduate', false)
                ->count();

            // Get incoming students
            $incomingStudents = TemporaryClassStudent::with([
                'student' => fn($query) => $query->select('id', 'full_name', 'nis'),
                'initialClass' => fn($query) => $query->select('id', 'name')
            ])
                ->where('target_class_id', $classId)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'full_name' => $item->student->full_name,
                        'nis' => $item->student->nis,
                        'initial_class_name' => $item->initialClass->name
                    ];
                });

            return Inertia::render('grade-promotions/promotion-assign', [
                'currentClass' => [
                    'id' => $currentClass->id,
                    'name' => $currentClass->name,
                    'level' => $currentClass->level
                ],
                'students' => $students,
                'targetClassOptions' => $targetClassOptions,
                'isHighestLevel' => $isHighestLevel,
                'unassignedCount' => $unassignedCount,
                'incomingStudents' => $incomingStudents
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function updateAssign(Request $request, $classId)
    {
        try {
            Classroom::findOrFail($classId);
            $hasStudents = TemporaryClassStudent::where('initial_class_id', $classId)->exists();

            if (!$hasStudents) {
                DB::transaction(function () use ($classId) {
                    TemporaryClassStatus::updateOrCreate(
                        ['class_id' => $classId],
                        ['status' => 'completed']
                    );
                });

                return redirect()->back()->with('success', 'Status kelas kosong berhasil diperbarui');
            }

            $validated = $request->validate([
                'students' => 'required|array',
                'students.*.id' => 'required|exists:temporary_class_students,id',
                'students.*.target_class_id' => 'nullable|exists:classrooms,id',
                'students.*.is_graduate' => 'boolean'
            ]);

            DB::transaction(function () use ($validated, $classId) {
                foreach ($validated['students'] as $studentData) {
                    TemporaryClassStudent::where('id', $studentData['id'])->update([
                        'target_class_id' => $studentData['target_class_id'] ?? null,
                        'is_graduate' => $studentData['is_graduate'] ?? false
                    ]);
                }

                $unassignedCount = TemporaryClassStudent::where('initial_class_id', $classId)
                    ->whereNull('target_class_id')
                    ->where('is_graduate', false)
                    ->count();

                TemporaryClassStatus::updateOrCreate(
                    ['class_id' => $classId],
                    ['status' => $unassignedCount === 0 ? 'completed' : 'draft']
                );
            });

            return redirect()->back()->with('success', 'Student assignments updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Gagal menyimpan perubahan: ' . $e->getMessage());
        }
    }

    public function finalize(Request $request)
    {
        $incompleteClasses = TemporaryClassStatus::where('status', '!=', 'completed')
            ->with('classroom')
            ->get()
            ->pluck('classroom.name');

        if ($incompleteClasses->isNotEmpty()) {
            return back()->with(
                'error',
                'Proses finalisasi gagal. Kelas berikut belum selesai: '
                    . $incompleteClasses->implode(', ')
            );
        }

        try {
            $validated = $request->validate([
                'attendance_mode' => 'required|in:' . implode(',', AttendanceMode::getValues()),
            ]);

            DB::transaction(function () use ($validated) {
                $currentYear = $this->getAcademicYear()->start_year;

                AcademicYear::create([
                    'start_year' => $currentYear + 1,
                    'title' => ($currentYear + 1) . "/" . ($currentYear + 2),
                    'status' => AcademicYearStatus::Active->value,
                    'attendance_mode' => $validated['attendance_mode']
                ]);

                // activate flag finalization
                Student::$isFinalizing = true;

                // chunk migration
                TemporaryClassStudent::orderBy('id')->chunk(100, function ($students) {
                    foreach ($students as $temp) {
                        $student = Student::find($temp->student_id);

                        if ($temp->is_graduate) {
                            $student->update([
                                'class_id' => null,
                                'status' => StudentStatus::Graduated->value
                            ]);
                        } elseif ($temp->target_class_id) {
                            $student->update([
                                'class_id' => $temp->target_class_id,
                                'status' => StudentStatus::Active->value,
                            ]);
                        }
                    }
                });

                // Turn off flag
                Student::$isFinalizing = false;

                TemporaryClassStatus::query()->delete();
                TemporaryClassStudent::query()->delete();
            });

            return redirect()->back()
                ->with('success', 'Migrasi kelas berhasil difinalisasi');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memfinalisasi migrasi: ' . $e->getMessage());
        }
    }

    public function resetData()
    {
        try {
            TemporaryClassStudent::truncate();
            TemporaryClassStatus::truncate();

            return redirect()->route('grade-promotions.index')
                ->with('success', 'Proses kenaikan kelas berhasil direset');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal reset kenaikan kelas: ' . $e->getMessage());
        }
    }
}
