<?php

namespace App\Listeners;

use App\Events\PaymentCreated;\
use App\Jobs\SendPaymentRealTimeNotification;
use App\Models\Role;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendPaymentNotification implements ShouldQueue
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
    public function handle(PaymentCreated $event): void
    {
        $payment = $event->payment;

        $payment->load(['assignments.student.parent']);

        foreach ($payment->assignments as $assignment) {
            if ($assignment->student && $assignment->student->parent) {
                $parentUser = $assignment->student->parent;

                // Pastikan parent dan punya notification_key
                if ($this->isParentUser($parentUser) && $parentUser->notification_key) {
                    SendPaymentRealTimeNotification::dispatch($payment, $parentUser, 'created');
                }
            }
        }
    }

    protected function isParentUser($user)
    {
        return $user->role_id === Role::where('name', 'parent')->first()->id;
    }
}
