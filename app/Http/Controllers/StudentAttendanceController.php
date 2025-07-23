<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\ShiftAttendanceStatus;
use App\Models\AcademicYear;
use App\Models\CustomDayOff;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentAttendanceController extends Controller
{
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
            'dayOffOptions' => CustomDayOff::limit(10)->get(['id', 'description'])->toArray(),
        ]);
    }

    public function updateAttendance(Request $request, $attendanceId)
    {
        try {

            $attendance = ShiftingAttendance::findOrFail($attendanceId);

            $validated = $request->validate([
                'clock_in_hour' => 'nullable|date_format:H:i',
                'clock_out_hour' => 'nullable|date_format:H:i|after:clock_in_hour',
                // 'status' => 'required|in:' . implode(',', ShiftAttendanceStatus::getValues()),
                'status' => 'required|in:present,present_in_tolerance,alpha,late,leave,sick_leave,day_off',
                'minutes_of_late' => 'nullable|integer|min:0',
                'note' => 'nullable|string|max:255',
                'day_off_reason' => 'required_if:status,' . ShiftAttendanceStatus::DayOff->value . '|nullable|exists:custom_day_offs,description',
            ]);

            $attendance->update($validated);

            return redirect()->back()->with('success', 'Attendance updated successfully');
        } catch (Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui data: ' . $e->getMessage());
        }
    }
}
