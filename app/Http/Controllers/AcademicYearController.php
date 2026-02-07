<?php

namespace App\Http\Controllers;

use App\Enums\AcademicYearStatus;
use App\Enums\AttendanceMode;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
            ->when(!$request->sort, fn($q) => $q->orderBy('created_at', 'desc'))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('academic-years/index', [
            'academicYears' => $academicYears,
            'attendanceModes' => $attendanceModes,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'start_year' => [
                    'required',
                    'integer',
                    Rule::unique(AcademicYear::class),
                ],
                'attendance_mode' => 'required|in:' . implode(',', AttendanceMode::getValues()),
                'note' => 'nullable|string|max:255',
            ], [
                'note.max' => 'Catatan maksimal 255 Karakter'
            ]);

            AcademicYear::create([
                'start_year' => $request->start_year,
                'title' => $request->start_year . '/' . ($request->start_year + 1),
                'status' => AcademicYearStatus::Active->value,  // Status is set to active by default
                'attendance_mode' => $request->attendance_mode,
                'note' => $request->note,
            ]);

            return back()
                ->with('success', 'Tahun ajaran berhasil ditambahkan.')
                ->with('queryParams', request()->query());
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan tahun ajaran: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {

            $academicYear = AcademicYear::findOrFail($id);

            $request->validate([
                'start_year' => [
                    'required',
                    'integer',
                    Rule::unique(AcademicYear::class)->ignore($academicYear->id),
                ],
                'attendance_mode' => 'required|in:' . implode(',', AttendanceMode::getValues()),
                'note' => 'nullable|string|max:255',
            ], [
                'note.max' => 'Catatan maksimal 255 Karakter'
            ]);

            $academicYear->update([
                'start_year' => $request->start_year,
                'title' => $request->start_year . '/' . ($request->start_year + 1),
                'attendance_mode' => $request->attendance_mode,
                'note' => $request->note,
            ]);

            return back()
                ->with('success', 'Tahun ajaran berhasil diperbarui.')
                ->with('queryParams', request()->query());
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui tahun ajaran: ' . $e->getMessage())
                ->withInput();
        }
    }
}
