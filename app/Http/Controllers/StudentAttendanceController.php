<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Enums\ShiftAttendanceStatus;
use App\Enums\SubjectAttendanceStatus;
use App\Models\AcademicYear;
use App\Models\CustomDayOff;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use App\Models\SubjectAttendance;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentAttendanceController extends Controller
{
    public function showAttendanceHistory($studentId, Request $request)
    {
        $student = Student::with(['classroom', 'classroom.mainTeacher'])->findOrFail($studentId);
        $academicYears = AcademicYear::orderBy('start_year', 'desc')->get();

        // get academic year with attendance mode
        $academicYearId = $this->getAcademicYearId($request);
        $selectedAcademicYear = AcademicYear::find($academicYearId);
        $attendanceMode = $selectedAcademicYear->attendance_mode ?? null;

        // date filters
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));

        $responseData = [
            'student' => $student,
            'academicYears' => $academicYears,
            'filters' => [
                'academic_year_id' => $academicYearId,
                'month' => (int)$month,
                'year' => (int)$year,
            ],
            'dayOffOptions' => CustomDayOff::limit(10)->get(['id', 'description'])->toArray(),
            'attendanceMode' => $attendanceMode,
        ];

        if ($attendanceMode === AttendanceMode::PerShift->value) {
            $responseData =  array_merge($responseData, $this->getShiftAttendanceData(
                $studentId,
                $academicYearId,
                $year,
                $month
            ));
        } elseif ($attendanceMode === AttendanceMode::PerSubject->value) {
            $responseData = array_merge($responseData, $this->getSubjectAttendanceData(
                $studentId,
                $academicYearId,
                $year,
                $month
            ));
        }

        return Inertia::render('students/attendanceHistory', $responseData);
    }
    private function getAcademicYearId(Request $request): ?int
    {
        // default active academic year if not set
        $activeAcademicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->first();
        return $request->input('academic_year_id', $activeAcademicYear->id ?? null);
    }

    private function calculateShiftStatistics($attendances)
    {
        $statistics = array_fill_keys(ShiftAttendanceStatus::getValues(), 0);

        foreach ($attendances as $attendance) {
            if (isset($statistics[$attendance->status])) {
                $statistics[$attendance->status]++;
            }
        }

        return $statistics;
    }

    private function calculateSubjectStatistics($attendances)
    {
        $statistics = array_fill_keys(SubjectAttendanceStatus::getValues(), 0);

        foreach ($attendances as $attendance) {
            if (isset($statistics[$attendance->status])) {
                $statistics[$attendance->status]++;
            }
        }

        return $statistics;
    }

    private function getShiftAttendanceData($studentId, $academicYearId, $year, $month)
    {
        $query = ShiftingAttendance::where('student_id', $studentId)
            ->with('academicYear');

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }

        $attendances = $query->whereYear('submit_date', $year)
            ->whereMonth('submit_date', $month)
            ->orderBy('submit_date', 'desc')
            ->get();

        return [
            'shiftAttendances' => $attendances,
            'shiftStatistics' => $this->calculateShiftStatistics($attendances),
        ];
    }

    private function getSubjectAttendanceData($studentId, $academicYearId, $year, $month)
    {
        $query = SubjectAttendance::where('student_id', $studentId)
            ->with('academicYear');

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }

        $attendances = $query->whereYear('submit_date', $year)
            ->whereMonth('submit_date', $month)
            ->orderBy('submit_date', 'desc')
            ->orderBy('subject_start_hour', 'asc')
            ->get();

        return [
            'subjectAttendances' => $attendances,
            'subjectStatistics' => $this->calculateSubjectStatistics($attendances),
        ];
    }


    public function updateShiftAttendance(Request $request, $attendanceId)
    {
        try {

            $attendance = ShiftingAttendance::findOrFail($attendanceId);

            $validated = $request->validate([
                'clock_in_hour' => 'nullable|date_format:H:i',
                'clock_out_hour' => 'nullable|date_format:H:i|after:clock_in_hour',
                'status' => 'required|in:' . implode(',', ShiftAttendanceStatus::getValues()),
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

    public function updateSubjectAttendance(Request $request, $attendanceId)
    {
        try {
            $attendance = SubjectAttendance::findOrFail($attendanceId);

            $validated = $request->validate([
                'submit_hour' => 'nullable|date_format:H:i',
                'status' => 'required|in:' . implode(',', SubjectAttendanceStatus::getValues()),
                'note' => 'nullable|string|max:255',
            ]);

            $attendance->update($validated);

            return redirect()->back()->with('success', 'Data kehadiran mata pelajaran berhasil diperbarui');
        } catch (Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui data: ' . $e->getMessage());
        }
    }
}
