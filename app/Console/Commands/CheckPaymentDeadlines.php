<?php

namespace App\Console\Commands;

use App\Jobs\PaymentDeadlineReminder;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckPaymentDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:payment-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check payment deadlines and send reminders to parents';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now('Asia/Jakarta');
        $currentTime = $now->format('H:i');

        // Hanya jalan antara 01:45 - 02:00 WIB
        if ($currentTime < '01:45' || $currentTime > '02:00') {
            Log::info('[Cron] Payment Deadline Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan.');
            $this->info('Lewat jam eksekusi (now: ' . $currentTime . '), command tidak dijalankan..');
            return;
        }

        $reminderDays = (int) Setting::getValue('payment_reminder_days', 1);
        $targetDate = $now->copy()->addDays($reminderDays)->format('Y-m-d');

        $this->info("Checking payment deadlines for date: {$targetDate} UTC");
        Log::info("Checking payment deadlines for date: {$targetDate} UTC");

        $payments = Payment::whereDate('due_date', $targetDate)
            ->with(['academicYear', 'assignments.student.parent'])
            ->get();

        if ($payments->isEmpty()) {
            $this->info("No payments found with {$reminderDays} deadline");
            Log::info("No payments found with {$reminderDays} deadline");
            return;
        }

        $notificationCount = 0;

        foreach ($payments as $payment) {
            $this->info("Processing payment: {$payment->title}");

            foreach ($payment->assignments as $assignment) {
                if ($assignment->student && $assignment->student->parent) {

                    $parentUser = $assignment->student->parent;

                    if ($this->isParentUser($parentUser) && $parentUser->notification_key) {
                        $this->info("Dispatching reminder for parent: {$parentUser->full_name}");

                        // Dispatch job untuk kirim notifikasi
                        PaymentDeadlineReminder::dispatch($payment, $parentUser);
                        $notificationCount++;
                    }
                }
            }
        }

        $this->info("Dispatched {$notificationCount} payment reminder jobs");
        Log::info("Dispatched {$notificationCount} payment reminder jobs");
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
