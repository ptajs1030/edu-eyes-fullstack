<?php

namespace App\Services;

use App\Exceptions\SilentHttpException;
use App\Models\TaskAssignment;
use Carbon\Carbon;

class TaskService
{
    public function getTasks($student, $search, $subject){
        $query=TaskAssignment::query();
        $query->where('student_id', $student->id);

        if ($search) {
            $query->whereHas('task', function($q) use ($search) {
               $q->where('title', 'like', '%'.$search.'%'); 
            });
        }

        if ($subject) {
            $query->whereHas('task', function($q) use ($subject) {
                $q->whereHas('subject', function($q) use ($subject) {
                    $q->where('name', $subject);
                });
            });

        }

        $tasks = $query->with(['task.subject' => function ($q) { $q->withTrashed(); }])->paginate(10);
        if ($tasks->isEmpty()) {
            throw new SilentHttpException(404, 'tugas tidak ditemukan');
        }
        $tasksWithRelations = $tasks->map(function($i) {
            $task = $i->task;
            $subjectName = $task && $task->subject ? $task->subject->name : null;
            return [
                'id' => $i->id,
                'subject' => $subjectName,
                'title' => $task ? $task->title : null,
                'description' => $task ? $task->description : null,
                'score' => $i->score ?? 0,
                'due_date' => $task && $task->due_date ? Carbon::parse($task->due_date)->format('Y-m-d') : null,
                'due_time' => $task && $task->due_time ? Carbon::parse($task->due_time)->format('H:i') : null,
                'created_at' => $task ? $task->created_at : null
            ];
        })->toArray();

        return [
            'current_page'=>$tasks->currentPage(),
            'last_page'=>$tasks->lastPage(),
            'per_page'=>$tasks->perPage(),
            'tasks'=>$tasksWithRelations,
        ];

    }

    public function getTaskDetail($id, $student){
        $query = TaskAssignment::query();
        $query->where("student_id", $student->id);
        $query->where('id', $id);
        $task = $query->with(['task.subject' => function ($q) { $q->withTrashed(); }])->first();

        if (!$task || !$task->task) {
            throw new SilentHttpException(404, 'tugas tidak ditemukan');
        }

        $subjectName = $task->task->subject ? $task->task->subject->name : null;
        $attachments = $task->task->attachments ? $task->task->attachments()->pluck('url')->toArray() : [];

        return [
            'id' => $task->id,
            'subject' => $subjectName,
            'title' => $task->task->title ?? null,
            'description' => $task->task->description ?? null,
            'attachments' => $attachments,
            'score' => $task->score ?? 0,
            'due_date' => $task->task->due_date ? Carbon::parse($task->task->due_date)->format('Y-m-d') : null,
            'due_time' => $task->task->due_time ? Carbon::parse($task->task->due_time)->format('H:i') : null,
            'created_at' => $task->task->created_at ?? null
        ];
    }
}