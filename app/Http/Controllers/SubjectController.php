<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\ClassSubjectSchedule;
use App\Models\Exam;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $subjects = Subject::query()
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'name', $request->direction ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('subjects/index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'curriculum_year' => 'required|string|max:70',
                'is_archived' => 'required|boolean'
            ]);

            Subject::create($validated);

            return back()
                ->with('success', 'Mata pelajaran berhasil ditambahkan.')
                ->with('queryParams', request()->query());
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan mata pelajaran: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $subject = Subject::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:70',
                'curriculum_year' => 'required|string|max:70',
                'is_archived' => 'required|boolean'
            ]);

            $subject->update($validated);

            return redirect()->back()
                ->with('success', 'Mata pelajaran berhasil diperbarui');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui mata pelajaran: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            // Check active Class Subject Schedules
            $hasActiveSubjectSchedule = ClassSubjectSchedule::where('subject_id', $id)
                ->whereHas('classroom', function ($query) {
                    $query->whereNull('deleted_at');
                })
                ->exists();

            if ($hasActiveSubjectSchedule) {
                return redirect()->back()
                    ->with('error', 'Mata pelajaran tidak dapat dihapus karena masih digunakan di Jadwal Pelajaran Kelas aktif.');
            }

            // Check if subject is used in active exams
            $hasActiveExam = Exam::where('subject_id', $id)->exists();

            if ($hasActiveExam) {
                return redirect()->back()
                    ->with('error', 'Mata pelajaran tidak dapat dihapus karena masih memiliki Ujian aktif.');
            }

            // Check if subject is used in active tasks
            $hasActiveTask = Task::where('subject_id', $id)->exists();

            if ($hasActiveTask) {
                return redirect()->back()
                    ->with('error', 'Mata pelajaran tidak dapat dihapus karena masih memiliki Tugas aktif.');
            }

            $subject = Subject::findOrFail($id);
            $subject->delete();

            return redirect()->back()
                ->with('success', 'Mata pelajaran berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', app()->environment('production')
                    ? 'Gagal menghapus mata pelajaran'
                    : 'Gagal menghapus mata pelajaran: ' . $e->getMessage());
        }
    }

    public function searchSubject(Request $request)
    {
        $request->validate([
            'query' => 'nullable|string'
        ]);

        $query = $request->input('query', '');

        $subjects = Subject::where('is_archived', false)
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name as full_name']);

        return response()->json($subjects);
    }
}
