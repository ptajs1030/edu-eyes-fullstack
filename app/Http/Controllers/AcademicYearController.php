<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Response;
use Inertia\Inertia;

class AcademicYearController extends Controller
{
    public function index(Request $request): Response
    {
        $attendanceModes = collect(AttendanceMode::cases())->map(fn($mode) => [
            'value' => $mode->value,
            'label' => $mode->label(),
        ]);

        $academicYears = AcademicYear::query()
            ->when($request->search, fn($q) => $q->where('start_year', 'like', "%{$request->search}%"))
            ->when($request->sort, fn($q) => $q->orderBy($request->sort, $request->direction ?? 'asc'))
            ->when(!$request->sort, fn($q) => $q->orderBy('start_year', 'desc'))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('academic-year', [
            'academicYears' => $academicYears,
            'attendanceModes' => $attendanceModes,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_year' => [
                'required',
                'integer',
                Rule::unique(AcademicYear::class),
            ],
            'attendance_mode' => 'required|in:' . implode(',', AttendanceMode::getValues()),
            'note' => 'nullable|string',
        ]);

        AcademicYear::create([
            'start_year' => $request->start_year,
            'title' => $request->start_year . '/' . ($request->start_year + 1),
            'status' => AcademicYearStatus::Active->value,  // Status is set to active by default
            'attendance_mode' => $request->attendance_mode,
            'note' => $request->note,
        ]);

        return redirect()->route('academic-years.index')->with('success', 'Academic Year created successfully.');
    }

    public function update(Request $request, $id)
    {
        $academicYear = AcademicYear::findOrFail($id);

        $request->validate([
            'start_year' => [
                'required',
                'integer',
                Rule::unique(AcademicYear::class)->ignore($academicYear->id),
            ],
            'attendance_mode' => 'required|in:' . implode(',', AttendanceMode::getValues()),
            'note' => 'nullable|string',
        ]);

        $academicYear->update([
            'start_year' => $request->start_year,
            'title' => $request->start_year . '/' . ($request->start_year + 1),
            'attendance_mode' => $request->attendance_mode,
            'note' => $request->note,
        ]);

        return redirect()->route('academic-years.index')->with('success', 'Academic Year updated successfully.');
    }

    public function destroy($id)
    {
        $academicYear = AcademicYear::findOrFail($id);
        $academicYear->delete();

        return redirect()->route('academic-years.index')->with('success', 'Academic Year deleted successfully.');
    }
}
