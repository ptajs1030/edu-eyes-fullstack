<?php

namespace App\Jobs;

use App\Models\Task;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTaskRealTimeNotification implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

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

            $dueDate = $this->task->due_date->format('d M Y H:i');
            $subjectName = $this->task->subject->name ?? 'Umum';

            if ($this->type === 'created') {
                $title = 'Tugas Baru Ditambahkan';
                $body = "Tugas '{$this->task->title}' ({$subjectName}) telah ditambahkan untuk anak Anda. Deadline: {$dueDate}";
            } elseif ($this->type === 'manual') {
                $title = 'Pengingat Tugas';
                $body = "Pengingat: Tugas '{$this->task->title}' ({$subjectName}) untuk anak Anda. Deadline: {$dueDate}";
            } else {
                Log::warning("Type tidak sesuai");
            }

            $data = [
                'type' => 'task_' . $this->type,
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

            Log::info('Task real-time notification sent', [
                'type' => $this->type,
                'user_id' => $this->parentUser->id,
                'task_id' => $this->task->id
            ]);
        } catch (\Throwable $th) {
            Log::error('Gagal kirim task real-time notification', [
                'user_id' => $this->parentUser->id,
                'task_id' => $this->task->id,
                'error' => $th->getMessage()
            ]);

            throw $th;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Job SendTaskRealTimeNotification failed', [
            'task_id' => $this->task->id,
            'user_id' => $this->parentUser->id,
            'error' => $exception->getMessage()
        ]);
    }
}
