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

        $tasks=$query->with('task')->paginate(10);
        if ($tasks->isEmpty()) {
            throw new SilentHttpException(404, 'tugas tidak ditemukan');
        }
        $tasksWithRelations=$tasks->map(function($i) {
            return [
                'id'=>$i->id,
                'subject'=>$i->task->subject->name,
                'title'=>$i->task->title,
                'description'=>$i->task->description,
                'score' => $i->score ?? 0, 
                'due_date'=>Carbon::parse($i->task->due_date)->format('Y-m-d'),
                'due_time'=>Carbon::parse($i->task->due_time)->format('H:i'),
                'created_at'=>$i->task->created_at
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
        $query=TaskAssignment::query();
        $query->where("student_id", $student->id);
        $query->where('id', $id);
        $task=$query->with('task')->first();
        $attachments=$task->task->attachments()->pluck('url')->toArray();

        if (!$task) {
            throw new SilentHttpException(404, 'tugas tidak ditemukan');
        }
        return [
            'id'=>$task->id,
            'subject'=>$task->task->subject->name,
            'title'=>$task->task->title,
            'description'=>$task->task->description,
            'attachments'=>$attachments,
            'score' => $task->score ?? 0, 
            'due_date'=>Carbon::parse($task->task->due_date)->format('Y-m-d'),
            'due_time'=>Carbon::parse($task->task->due_time)->format('H:i'),
            'created_at'=>$task->task->created_at
        ];
    }
}