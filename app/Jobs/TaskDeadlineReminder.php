<?php

namespace App\Jobs;

use App\Models\Setting;
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
    protected $type;

    /**
     * Create a new job instance.
     */
    public function __construct(Task $task, User $parentUser, string $type)
    {
        $this->task = $task;
        $this->parentUser = $parentUser;
        $this->type = $type;
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

            $reminderDays = (int) Setting::getValue('task_reminder_days', 1);
            $dueDate = $this->task->due_date->format('d M Y H:i');

            $subjectName = $this->task->subject->name ?? '';

            $title = 'Pengingat Tugas';
            $body = "Tugas '{$this->task->title}' ({$subjectName}) untuk anak Anda akan berakhir dalam {$reminderDays} hari pada {$dueDate}!";

            if ($this->type === 'deadline') {
                $title = 'Pengingat Deadline Tugas';
                $body = "Tugas '{$this->task->title}' ({$subjectName}) untuk anak Anda akan berakhir dalam {$reminderDays} hari pada {$dueDate}!";
            }

            $data = [
                'type' => 'task_deadline',
                'task_id' => (string) $this->task->id,
                'title' => $this->task->title,
                'due_date' => $this->task->due_date->format('Y-m-d H:i:s'),
                'subject' => $subjectName,
                'action' => 'view_task'
            ];

            $firebaseService->sendToDevice(
                $this->parentUser->notification_key,
                $title,
                $body,
                $data
            );

            Log::info('Task reminder sent successfully', [
                'type' => $this->type,
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
