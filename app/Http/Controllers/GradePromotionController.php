<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Enums\StudentStatus;
use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\TemporaryClassStatus;
use App\Models\TemporaryClassStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            DB::transaction(function () {
                $currentAcademicYearId = $this->getAcademicYear()->id;
                if (!$currentAcademicYearId) {
                    throw new \Exception('Tahun akademik aktif tidak ditemukan');
                }

                // Clear existing temporary data
                TemporaryClassStudent::truncate();
                TemporaryClassStatus::truncate();

                $students = Student::where('status', StudentStatus::Active->value)
                    ->whereNotNull('class_id')
                    ->get();

                if ($students->isEmpty()) {
                    throw new \Exception('Tidak ada siswa aktif yang ditemukan');
                }

                $classIds = [];
                foreach ($students as $student) {
                    TemporaryClassStudent::create([
                        'student_id' => $student->id,
                        'academic_year_id' => $currentAcademicYearId,
                        'initial_class_id' => $student->class_id,
                        'target_class_id' => null,
                        'is_graduate' => false
                    ]);

                    if (!in_array($student->class_id, $classIds)) {
                        $classIds[] = $student->class_id;
                        TemporaryClassStatus::create([
                            'class_id' => $student->class_id,
                            'status'   => 'draft',
                        ]);
                    }
                }
            });

            return redirect()
                ->route('grade-promotions.index')
                ->with('success', 'Data siswa berhasil dipopulate');
        } catch (\Exception $e) {
            return redirect()
                ->route('grade-promotions.index')
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
}
