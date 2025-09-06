<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskAttachment;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;

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
    public function index (Request $request){
        $tasks= Task::query()
            ->with('attachments')
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->orderBy($request->sort ?? 'created_at', $request->direction ?? 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('tasks/index',[
            'tasks' => $tasks,
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function create (){
        $activeAcademicYear = AcademicYear::where('status', 'active')->first();
        $classrooms=Classroom::orderBy('level')->orderBy('name')->get();
        $subjects=Subject::orderBy('name')->get();
        return Inertia::render('tasks/form', [
            'academicYears' => AcademicYear::all(),
            'classrooms' => $classrooms,
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request){
        try {
            $validated=$request->validate([
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
            DB::transaction(function () use ($validated) {
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
            });

            return redirect()->route('tasks.index')
                ->with('success', 'Tugas Berhasil Ditambahkan');
        } catch (\ValidationException $e) {
           return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create task: ' . $e->getMessage())
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

    public function edit(Task $task){
        $task->load('attachments', 'assignments','academicYear' );

        $classrooms = Classroom::orderBy('level')->orderBy('name')->get();
        $academicYears = AcademicYear::where('status', 'active')->get();
        $selectedStudents = $task->assignments->pluck('student_id')->toArray();
        $subjects=Subject::orderBy('name')->get();

        return Inertia::render('tasks/form', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'due_date' => $this->formatTimeForDisplay($task->due_date),
                'due_time' => Carbon::parse($task->due_time)->format('H:i'),
                'academic_year_id' => $task->academic_year_id,
                'subject_id' => $task->subject_id,
                'attachments' => $task->attachments,
            ],
            'selectedStudents' => $selectedStudents,
            'classrooms' => $classrooms,
            'academicYears' => $academicYears,
            'subjects'=>$subjects,
        ]);
    }

    public function update(Request $request, Task $task){
        try {
            $validated=$request->validate([
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

            DB::transaction(function () use ($validated, $task) {
                $task->update([
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'due_date' => $this->formatTimeForDatabase($validated['due_date']),
                    'due_time' => $validated['due_time'],
                    'academic_year_id' => $validated['academic_year_id'],
                    'subject_id' => $validated['subject_id'],
                ]);

                if (!empty($validated['attachments'])) {
                    $this->handleAttachments($task->id, $validated['attachments']);
                } else {
                    TaskAttachment::where('task_id', $task->id)->delete();
                }

                TaskAssignment::where('task_id', $task->id)->delete();
                foreach ($validated['student_ids'] as $studentId) {
                    $student = Student::find($studentId);
                    TaskAssignment::create([
                        'task_id' => $task->id,
                        'student_id' => $studentId,
                        'class_id' => $student ? $student->class_id : null,
                        'class_name' => $student ? $student->classroom->name : null,
                    ]);
                }
            });

            return redirect()->route('tasks.index')
                ->with('success', 'Tugas Berhasil Diperbarui');
        } catch (\ValidationException $e) {
           return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update task: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function show(Task $task){
        try {
            $task->load('attachments', 'assignments.student', 'academicYear', 'subject');


            $studentAssignments = $task->assignments->map(function ($assignment) {
                return [
                    'id' => $assignment->student?->id,
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
                    'subject' => $task->subject ,
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

    public function updateScore(Request $request, $taskId, $assignmentId){
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

}
