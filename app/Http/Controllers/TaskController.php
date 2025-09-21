<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Events\TaskCreated;
use App\Jobs\SendTaskRealTimeNotification;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskAttachment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB as FacadesDB;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    private function formatTimeForDisplay($time)
    {
        return Carbon::parse($time)->format('Y-m-d');
    }

    private function formatTimeForDatabase($time)
    {
        return Carbon::parse($time)->format('Y-m-d');
    }
    public function index(Request $request)
    {
        $tasks = Task::query()
            ->with('attachments')
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function create()
    {
        $activeAcademicYear = AcademicYear::where('status', 'active')->first();
        $classrooms = Classroom::orderBy('level')->orderBy('name')->get();
        $subjects = Subject::orderBy('name')->get();
        return Inertia::render('tasks/form', [
            'academicYears' => AcademicYear::all(),
            'classrooms' => $classrooms,
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'due_date' => 'required|date',
                'academic_year_id' => 'required|exists:academic_years,id',
                'subject_id' => 'required|exists:subjects,id',
                'due_time' => 'required',
                'attachments' => 'nullable|array',
                'attachments.*.url' => 'required|url',
                'student_ids' => 'required|array|min:1',
                'student_ids.*' => 'exists:students,id',
            ]);
            FacadesDB::transaction(function () use ($validated) {
                $task = Task::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'due_date' => $this->formatTimeForDatabase($validated['due_date']),
                    'due_time' => $validated['due_time'],
                    'academic_year_id' => $validated['academic_year_id'],
                    'subject_id' => $validated['subject_id'],
                ]);

                if (!empty($validated['attachments'])) {
                    $this->handleAttachments($task->id, $validated['attachments']);
                }

                foreach ($validated['student_ids'] as $studentId) {
                    $student = Student::find($studentId);
                    TaskAssignment::create([
                        'task_id' => $task->id,
                        'student_id' => $studentId,
                        'class_id' => $student ? $student->class_id : null,
                        'class_name' => $student ? $student->classroom->name : null,
                    ]);
                }

                event(new TaskCreated($task));
            });

            return redirect()->route('tasks.index')
                ->with('success', 'Tugas Berhasil Ditambahkan');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan tugas: ' . $e->getMessage())
                ->withInput();
        }
    }
    private function handleAttachments($taskId, $attachments)
    {
        TaskAttachment::where('task_id', $taskId)->delete();

        foreach ($attachments as $attachment) {
            TaskAttachment::create([
                'task_id' => $taskId,
                'url' => $attachment['url']
            ]);
        }
    }

    public function edit($id)
    {
        try {
            $task = Task::with(['subject', 'academicYear', 'assignments.student', 'assignments.class'])
                ->findOrFail($id);


            $studentAssignments = $task->assignments->map(function ($assignment) {
                return [
                    'student_id' => $assignment->student_id,
                    'student_name' => $assignment->student->full_name,
                    'nis' => $assignment->student->nis,
                    'class_name' => $assignment->class_name,
                    'class_id' => $assignment->class_id,
                    'score' => $assignment->score,
                    'is_scored' => $assignment->score !== null
                ];
            });

            $subjects = Subject::all();
            $classrooms = Classroom::orderBy('name')->get();
            $academicYears = AcademicYear::all();

            return Inertia::render('tasks/edit', [
                'task' => [
                    'id' => $task->id,
                    'academic_year_id' => $task->academic_year_id,
                    'subject_id' => $task->subject_id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'due_date' => $task->due_date->format('Y-m-d'),
                    'due_time' => $task->due_time->format('H:i'),
                    'student_assignments' => $studentAssignments,
                    'academic_year' => $task->academicYear, // Include academic year data
                ],
                'subjects' => $subjects,
                'academicYears' => $academicYears,
                'classrooms' => $classrooms,
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading task for edit', [
                'exam_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('tasks.index')
                ->with('error', 'Tugas tidak ditemukan atau terjadi kesalahan.');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'subject_id' => 'required|exists:subjects,id',
                'title' => 'required|string|max:70',
                'description' => 'nullable|string|max:70',
                'due_date' => 'required|date',
                'due_time' => 'required|date_format:H:i',
                'student_assignments' => 'required|array|min:1',
                'student_assignments.*.student_id' => 'required|exists:students,id',
                'student_assignments.*.student_name' => 'required|string',
                'student_assignments.*.class_name' => 'required|string',
                'student_assignments.*.class_id' => 'required|exists:classrooms,id',
            ], [
                'subject_id.required' => 'Mata pelajaran harus dipilih',
                'subject_id.exists' => 'Mata pelajaran tidak valid',
                'title.required' => 'Nama Tugas harus diisi',
                'title.max' => 'Nama Tugas maksimal 70 karakter',
                'description.max' => 'Deskripsi Tugas maksimal 70 karakter',
                'due_date.required' => 'Tanggal harus dipilih',
                'due_date.date' => 'Format tanggal tidak valid',
                'due_time.required' => 'Waktu harus diisi',
                'due_time.date_format' => 'Format waktu tidak valid',
                'student_assignments.required' => 'Minimal harus memilih 1 siswa',
                'student_assignments.min' => 'Minimal harus memilih 1 siswa',
                'student_assignments.*.student_id.required' => 'ID siswa harus ada',
                'student_assignments.*.student_id.exists' => 'Siswa tidak ditemukan',
            ]);

            DB::beginTransaction();

            $task = Task::findOrFail($id);


            $existingTask = Task::where('title', $validated['title'])
                ->where('subject_id', $validated['subject_id'])
                ->where('academic_year_id', $task->academic_year_id)
                ->where('id', '!=', $id)
                ->first();

            if ($existingTask) {
                throw new \Exception('Tugas dengan nama "' . $validated['title'] . '" sudah ada untuk mata pelajaran dan tahun ajaran yang sama.');
            }


            $task->update([
                'subject_id' => $validated['subject_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'due_date' => $validated['due_date'],
                'due_time' => $validated['due_time'],
            ]);


            $currentAssignments = $task->assignments()->get()->keyBy('student_id');

            $task->assignments()->delete();

            $studentIds = collect($validated['student_assignments'])->pluck('student_id')->toArray();
            $duplicateStudentIds = array_diff_assoc($studentIds, array_unique($studentIds));

            if (!empty($duplicateStudentIds)) {
                throw new \Exception('Terdapat siswa yang dipilih lebih dari sekali dalam tugas ini.');
            }

            $assignmentData = [];
            foreach ($validated['student_assignments'] as $assignment) {
                $existingAssignment = $currentAssignments->get($assignment['student_id']);

                $assignmentData[] = [
                    'task_id' => $task->id,
                    'student_id' => $assignment['student_id'],
                    'class_id' => $assignment['class_id'],
                    'class_name' => $assignment['class_name'],
                    'score' => $existingAssignment ? $existingAssignment->score : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            TaskAssignment::insert($assignmentData);

            DB::commit();

            return redirect()->route('tasks.index')
                ->with('success', 'Tugas berhasil diperbarui dengan ' . count($validated['student_assignments']) . ' siswa');
        } catch (ValidationException $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Data yang dimasukkan tidak valid. Silakan periksa kembali.');
        } catch (QueryException $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Terjadi kesalahan database. Silakan coba lagi atau hubungi administrator.')
                ->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', $e->getMessage()) // sudah user-friendly
                ->withInput();
        }
    }


    public function show(Task $task)
    {
        try {
            $task->load('attachments', 'assignments.student', 'academicYear', 'subject');


            $studentAssignments = $task->assignments->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'student_name' => $assignment->student?->full_name ?? '-',
                    'class_id' => $assignment->class_id,
                    'class_name' => $assignment->class_name,
                    'score' => $assignment->score,
                ];
            });


            return inertia::render('tasks/detail', [
                'task' => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'due_date' => $this->formatTimeForDisplay($task->due_date),
                    'due_time' => Carbon::parse($task->due_time)->format('H:i'),
                    'academic_year' => $task->academicYear,
                    'subject' => $task->subject,
                    'attachments' => $task->attachments,
                    'studentAssignments' => $studentAssignments,
                ],
                'studentAssignments' => $studentAssignments,
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading task for scoring', [
                'task_id' => $task->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('tasks.index')
                ->with('error', 'Task tidak ditemukan atau terjadi kesalahan.');
        }
    }

    public function updateScore(Request $request, $taskId, $assignmentId)
    {
        try {
            $validated = $request->validate([
                'score' => 'required|numeric|min:0|max:100',
            ], [
                'score.required' => 'Nilai harus diisi',
                'score.numeric' => 'Nilai harus berupa angka',
                'score.min' => 'Nilai minimal adalah 0',
                'score.max' => 'Nilai maksimal adalah 100',
            ]);

            $assignment = TaskAssignment::where('id', $assignmentId)
                ->where('task_id', $taskId)
                ->firstOrFail();

            $assignment->update(['score' => $validated['score']]);


            return redirect()->back()->with('success', 'Nilai berhasil disimpan');
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->with('error', 'Data tidak valid');
        } catch (\Exception $e) {
            Log::error('Error updating task score', [
                'task_id' => $taskId ?? null,
                'assignment_id' => $assignmentId,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan nilai');
        }
    }

    public function updateBulkScores(Request $request, $examId)
    {
        try {
            $validated = $request->validate([
                'scores' => 'required|array|min:1',
                'scores.*.assignment_id' => 'required|exists:task_assignments,id',
                'scores.*.score' => 'required|numeric|min:0|max:100',
            ], [
                'scores.required' => 'Data nilai harus ada',
                'scores.array' => 'Format data nilai tidak valid',
                'scores.min' => 'Minimal harus ada 1 nilai',
                'scores.*.assignment_id.required' => 'ID assignment harus ada',
                'scores.*.assignment_id.exists' => 'Assignment tidak ditemukan',
                'scores.*.score.required' => 'Nilai harus diisi',
                'scores.*.score.numeric' => 'Nilai harus berupa angka',
                'scores.*.score.min' => 'Nilai minimal adalah 0',
                'scores.*.score.max' => 'Nilai maksimal adalah 100',
            ]);

            DB::beginTransaction();

            $exam = Task::findOrFail($examId);
            $updatedCount = 0;

            foreach ($validated['scores'] as $scoreData) {
                $assignment = TaskAssignment::where('id', $scoreData['assignment_id'])
                    ->where('task_id', $examId)
                    ->first();

                if ($assignment) {
                    $assignment->update(['score' => $scoreData['score']]);
                    $updatedCount++;
                }
            }

            DB::commit();

            // Untuk Inertia, return redirect dengan flash message
            return redirect()->back()->with('success', "Berhasil menyimpan {$updatedCount} nilai");
        } catch (ValidationException $e) {
            DB::rollback();

            return redirect()->back()
                ->withErrors($e->errors())
                ->with('error', 'Data tidak valid');
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Error updating bulk exam scores', [
                'exam_id' => $examId,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan nilai');
        }
    }

    public function destroy($id)
    {
        try {
            $task = Task::withCount('assignments')->findOrFail($id);

            if ($task->assignments_count > 0) {
                return redirect()->back()
                    ->with('error', 'Tugas tidak dapat dihapus karena memiliki keterkaitan dengan data nilai siswa.');
            }

            $task->delete();

            return redirect()->route('tasks.index')
                ->with('success', 'Tugas berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Terjadi kesalahan saat menghapus tugas: ' . $e->getMessage());
        }
    }

    public function resendNotification(Task $task)
    {
        try {
            // Validasi: cek apakah task sudah lewat deadline
            $now = now('Asia/Jakarta');

            // Combine due_date and due_time properly
            $dueDate = $task->due_date->format('Y-m-d');
            $dueTime = $task->due_time ? $task->due_time->format('H:i:s') : '23:59:59';

            $dueDateTimeString = $dueDate . ' ' . $dueTime;

            $dueDateTime = Carbon::parse($dueDateTimeString, 'Asia/Jakarta');

            if ($now->greaterThan($dueDateTime)) {
                return redirect()->route('tasks.index')
                    ->with('error', 'Tidak dapat mengirim notifikasi karena tugas sudah melewati tenggat waktu.');
            }

            $task->load(['assignments.student.parent', 'subject']);

            $notificationCount = collect($task->assignments)
                ->filter(fn($a) => $a->student?->parent?->role->name === Role::Parent->value && $a->student->parent->notification_key)
                ->each(fn($a) => SendTaskRealTimeNotification::dispatch($task, $a->student->parent, $a->student, 'manual'))
                ->count();

            return redirect()->route('tasks.index')
                ->with(
                    $notificationCount > 0 ? 'success' : 'info',
                    $notificationCount > 0
                        ? "Notifikasi berhasil dikirim ke {$notificationCount} orang tua."
                        : 'Tidak ada orang tua yang dapat menerima notifikasi.'
                );
        } catch (\Exception $e) {
            Log::error('Gagal mengirim notifikasi', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('tasks.index')
                ->with('error', 'Gagal mengirim notifikasi: ' . $e->getMessage());
        }
    }
}
