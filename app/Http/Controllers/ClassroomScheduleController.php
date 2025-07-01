<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\Shifting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomScheduleController extends Controller
{
    public function showScheduleForm(Classroom $classroom): Response
    {
        // Ambil semua shifting yang tersedia
        $shiftings = Shifting::all(['id', 'name', 'start_hour', 'end_hour']);

        // Ambil semua guru dengan role teacher
        // $teachers = User::where('role', 'teacher')
        //     ->get(['id', 'full_name']);

        $teachers = User::whereHas('role', function ($query) {
            $query->where('name', 'teacher');
        })
            ->get(['id', 'full_name']);

        // Ambil jadwal yang sudah ada
        $existingSchedules = ClassShiftingSchedule::with(['shifting', 'teachers.teacher'])
            ->where('class_id', $classroom->id)
            ->get()
            ->keyBy('day');

        // Siapkan data untuk 7 hari
        $days = [];
        $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        for ($day = 1; $day <= 7; $day++) {
            $schedule = $existingSchedules->get($day);

            $days[] = [
                'day' => $day,
                'day_name' => $dayNames[$day - 1],
                'shifting_id' => $schedule ? $schedule->shifting_id : null,
                'teachers' => $schedule ? $schedule->teachers->pluck('teacher_id')->toArray() : [],
                'shifting' => $schedule ? $schedule->shifting : null,
                'selected_teachers' => $schedule ? $schedule->teachers->map(function ($pic) {
                    return ['id' => $pic->teacher_id, 'name' => $pic->teacher->full_name];
                }) : [],
            ];
        }

        return Inertia::render('Classrooms/Schedule', [
            'classroom' => $classroom,
            'days' => $days,
            'shiftings' => $shiftings,
            'teachers' => $teachers,
        ]);
    }

    public function saveSchedule(Request $request, Classroom $classroom)
    {
        $request->validate([
            'days' => 'required|array|size:7',
            'days.*.day' => 'required|integer|min:1|max:7',
            'days.*.shifting_id' => 'nullable|exists:shiftings,id',
            'days.*.teachers' => 'required_if:days.*.shifting_id,!=,null|array',
            'days.*.teachers.*' => 'exists:users,id',
        ]);

        DB::transaction(function () use ($request, $classroom) {
            // Hapus semua schedule lama untuk kelas ini
            ClassShiftingSchedule::where('class_id', $classroom->id)->delete();

            foreach ($request->days as $dayData) {
                if ($dayData['shifting_id']) {
                    $schedule = ClassShiftingSchedule::create([
                        'class_id' => $classroom->id,
                        'shifting_id' => $dayData['shifting_id'],
                        'day' => $dayData['day'],
                    ]);

                    // Tambahkan PIC untuk schedule ini
                    foreach ($dayData['teachers'] as $teacherId) {
                        $schedule->teachers()->create(['teacher_id' => $teacherId]);
                    }
                }
            }
        });

        return redirect()->back()->with('success', 'Schedule saved successfully');
    }
}
