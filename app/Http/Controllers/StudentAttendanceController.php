<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\ShiftAttendanceStatus;
use App\Models\AcademicYear;
use App\Models\CustomDayOff;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentAttendanceController extends Controller
{
    // private function formatTime($time)
    // {
    //     return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
    // }

    private function formatTime(?string $time): ?string
    {
        return $time ? Carbon::parse($time)->format('H:i') : null;
    }


    public function showAttendanceHistory($studentId, Request $request)
    {
        $student = Student::with(['classroom', 'classroom.mainTeacher'])->findOrFail($studentId);
        $academicYears = AcademicYear::orderBy('start_year', 'desc')->get();

        // Default filter: tahun akademik aktif dan bulan saat ini
        $activeAcademicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->first();
        $academicYearId = $request->input('academic_year_id', $activeAcademicYear->id ?? null);
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));

        // Query attendance
        $query = ShiftingAttendance::where('student_id', $studentId)
            ->with('academicYear');

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }

        $query->whereYear('submit_date', $year)
            ->whereMonth('submit_date', $month)
            ->orderBy('submit_date', 'desc');

        $attendances = $query->get();

        // Hitung statistik
        $statistics = [];
        foreach (ShiftAttendanceStatus::cases() as $status) {
            $statistics[$status->value] = 0;
        }

        foreach ($attendances as $attendance) {
            if (isset($statistics[$attendance->status])) {
                $statistics[$attendance->status]++;
            }
        }

        return Inertia::render('students/attendanceHistory', [
            'student' => $student,
            'attendances' => $attendances,
            'academicYears' => $academicYears,
            'filters' => [
                'academic_year_id' => $academicYearId,
                'month' => (int)$month,
                'year' => (int)$year,
            ],
            'statistics' => $statistics,
            'dayOffOptions' => CustomDayOff::limit(10)->pluck('description', 'id'),
        ]);
    }
}
