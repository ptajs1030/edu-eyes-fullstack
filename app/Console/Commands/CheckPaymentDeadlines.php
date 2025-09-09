<?php

namespace App\Console\Commands;

use App\Jobs\PaymentDeadlineReminder;
use App\Models\Payment;
use App\Models\Role;
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
        $tomorrow = Carbon::tomorrow()->format('Y-m-d');

        $this->info("Checking payment deadlines for date: {$tomorrow}");
        Log::info("Checking payment deadlines for date: {$tomorrow}");

        $payments = Payment::whereDate('due_date', $tomorrow)
            ->with(['academicYear', 'assignments.student.parent'])
            ->get();

        if ($payments->isEmpty()) {
            $this->info('No payments found with tomorrow deadline');
            Log::info('No payments found with tomorrow deadline');
            return;
        }

        $notificationCount = 0;

        foreach ($payments as $payment) {
            $this->info("Processing payment: {$payment->title}");

            foreach ($payment->assignments as $assignment) {
                if ($assignment->student && $assignment->student->parent) {

                    $parentUser = $assignment->student->parent;

                    // Pastikan user adalah parent dan punya notification_key
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
