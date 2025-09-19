<?php

namespace App\Console\Commands;

use App\Jobs\TaskDeadlineReminder;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckTaskDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:task-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check task deadlines and send reminders to parents';

    /**
     * Execute the console command.
     */
    public function handle()
    {

        $now = now('Asia/Jakarta');
        $currentTime = $now->format('H:i');

         // Hanya jalan antara 00:28 - 00:33 WIB (make sure only running once at 00:30)
        if ($currentTime < '00:28' || $currentTime > '00:33') {
            Log::info('[Cron] Task Deadline Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan.');
            $this->info('Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan..');
            return;
        }

        $reminderDays = (int) Setting::getValue('task_reminder_days', 1);
        $this->info("Reminder Days: {$reminderDays}");
        
        $targetDate = $now->copy()->addDays($reminderDays)->format('Y-m-d');

        $this->info("Checking task deadlines for date: {$targetDate} UTC");
        Log::info("Checking task deadlines for date: {$targetDate} UTC");

        $tasks = Task::whereDate('due_date', $targetDate)
            ->with(['subject', 'assignments.student.parent'])
            ->get();

        if ($tasks->isEmpty()) {
            $this->info("No tasks found with {$targetDate} deadline");
            Log::info("No tasks found with {$targetDate} deadline");
            return;
        }

        $notificationCount = 0;

        foreach ($tasks as $task) {
            $this->info("Processing task: {$task->title}");

            // Loop melalui assignments
            foreach ($task->assignments as $assignment) {
                if ($assignment->student && $assignment->student->parent) {
                    $parentUser = $assignment->student->parent;
                    // Pastikan user adalah parent dan punya notification_key
                    if ($this->isParentUser($parentUser) && $parentUser->notification_key) {
                        $this->info("Dispatching reminder for parent: {$parentUser->full_name} (student: {$assignment->student->full_name})");
                        // Dispatch job untuk kirim notifikasi, sertakan student
                        TaskDeadlineReminder::dispatch($task, $parentUser, $assignment->student);
                        $notificationCount++;
                    }
                }
            }
        }

        $this->info("Dispatched {$notificationCount} task reminder jobs");
        Log::info("Dispatched {$notificationCount} task reminder jobs");
    }

    /**
     * Check if user is a parent
     */
    protected function isParentUser($user)
    {
        $parentRole = Role::where('name', 'parent')->first();
        return $parentRole && $user->role_id === $parentRole->id;
    }
}
