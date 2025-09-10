<?php

namespace App\Listeners;

use App\Events\TaskCreated;
use App\Events\TaskUpdated;
use App\Jobs\SendTaskRealTimeNotification;
use App\Models\Role;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendTaskNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(TaskCreated|TaskUpdated $event): void
    {
        $task = $event->task;
        $type = $event instanceof TaskCreated ? 'created' : 'updated';

        $task->load(['assignments.student.parent', 'subject']);

        foreach ($task->assignments as $assignment) {
            if ($assignment->student && $assignment->student->parent) {
                $parentUser = $assignment->student->parent;
                
                if ($this->isParentUser($parentUser) && $parentUser->notification_key) {
                    SendTaskRealTimeNotification::dispatch($task, $parentUser, $type);
                }
            }
        }
    }

    protected function isParentUser($user)
    {
        return $user->role_id === Role::where('name', 'parent')->first()->id;
    }
}
