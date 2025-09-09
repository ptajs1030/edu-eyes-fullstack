<?php

namespace App\Jobs;

use App\Models\Task;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class TaskDeadlineReminder implements ShouldQueue
{
    use Queueable;

    protected $task;
    protected $parentUser;

    /**
     * Create a new job instance.
     */
    public function __construct(Task $task, User $parentUser)
    {
        $this->task = $task;
        $this->parentUser = $parentUser;
    }

    /**
     * Execute the job.
     */
    public function handle(FirebaseService $firebaseService): void
    {
        try {
            if (!$this->parentUser->notification_key) {
                Log::warning('User tidak memiliki notification_key', [
                    'user_id' => $this->parentUser->id,
                    'task_id' => $this->task->id
                ]);
                return;
            }

            $dueDate = $this->task->due_date->format('d M Y H:i');

            $title = 'Pengingat Deadline Tugas';
            $body = "Tugas '{$this->task->title}' untuk anak Anda akan berakhir pada ({$dueDate})!";

            $data = [
                'type' => 'task_deadline',
                'task_id' => (string) $this->task->id,
                'title' => $this->task->title,
                'due_date' => $this->task->due_date->format('Y-m-d H:i:s'),
                'subject' => $this->task->subject->name ?? '',
                'action' => 'view_task'
            ];

            $firebaseService->sendToDevice(
                $this->parentUser->notification_key,
                $title,
                $body,
                $data
            );

            Log::info('Task reminder sent successfully', [
                'user_id' => $this->parentUser->id,
                'task_id' => $this->task->id
            ]);
        } catch (\Throwable $th) {
            Log::error('Gagal kirim task reminder', [
                'user_id' => $this->parentUser->id,
                'task_id' => $this->task->id,
                'error' => $th->getMessage()
            ]);

            throw $th;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Job TaskDeadlineReminder failed', [
            'task_id' => $this->task->id,
            'user_id' => $this->parentUser->id,
            'error' => $exception->getMessage()
        ]);
    }
}
