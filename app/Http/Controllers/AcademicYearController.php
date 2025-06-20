<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function index()
    {
        $academicYears = AcademicYear::all();
        return response()->json($academicYears);
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_year' => 'required|integer',
            'title' => 'required|string|max:255',
            'status' => 'required|in:active,complete',
            'attendance_mode' => 'required|in:per-subject,per-shift',
            'note' => 'nullable|string',
        ]);

        $academicYears = AcademicYear::create($request->all());

        return response()->json($academicYears, 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'start_year' => 'required|integer',
            'title' => 'required|string|max:255',
            'status' => 'required|in:active,complete',
            'attendance_mode' => 'required|in:per-subject,per-shift',
            'note' => 'nullable|string',
        ]);

        $academicYear = AcademicYear::findOrFail($id);
        $academicYear->update($request->all());

        return response()->json($academicYear);
    }

    public function destroy($id)
    {
        $academicYear = AcademicYear::findOrFail($id);
        $academicYear->delete();

        return response()->json(null, 204);
    }
}
