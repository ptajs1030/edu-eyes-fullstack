<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\CustomDayOff;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentAttendanceController extends Controller
{
    public function showAttendanceHistory($studentId, Request $request)
    {
        $student = Student::with(['classroom', 'classroom.mainTeacher'])->findOrFail($studentId);
        $academicYears = AcademicYear::orderBy('start_year', 'desc')->get();

        // Default filter: tahun akademik aktif dan bulan saat ini
        $activeAcademicYear = AcademicYear::where('status', 'active')->first();
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
        $statistics = [
            'present' => 0,
            'present_in_tolerance' => 0,
            'alpha' => 0,
            'late' => 0,
            'leave' => 0,
            'sick_leave' => 0,
            'day_off' => 0,
        ];

        $currentDay = date('d');
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $daysCounted = min($daysInMonth, $month == date('m') ? $currentDay : $daysInMonth);

        foreach ($attendances as $attendance) {
            if (isset($statistics[$attendance->status])) {
                $statistics[$attendance->status]++;
            }
        }

        // Hitung alpha (total hari - hari yang punya data)
        $statistics['alpha'] = $daysCounted - count($attendances);

        return Inertia::render('students/history', [
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
