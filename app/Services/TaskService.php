<?php

namespace App\Services;

use App\Exceptions\SilentHttpException;
use App\Models\TaskAssignment;

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
        $tasksWithRelations = [];

        foreach ($tasks as $i) {
            $tasksWithRelations[] = [
                'id' => $i->id,
                'subject'=>$i->task->subject->name,
                'title'=>$i->task->title,
                'description'=>$i->task->description,
                'due_date'=>$i->task->due_date,
                'due_time'=>$i->task->due_time,
                'created_at'=>$i->task->created_at
            ];
        }

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
            'due_date'=>$task->task->due_date,
            'due_time'=>$task->task->due_time,
            'created_at'=>$task->task->created_at
        ];
    }
}