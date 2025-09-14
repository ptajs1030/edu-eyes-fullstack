<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PaymentDeadlineReminder implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

    protected $payment;
    protected $parentUser;
    protected $type;

    /**
     * Create a new job instance.
     */
    public function __construct(Payment $payment, User $parentUser, string $type = 'deadline')
    {
        $this->payment = $payment;
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
                    'payment_id' => $this->payment->id
                ]);

                return;
            }

            $reminderDays = (int) Setting::getValue('payment_reminder_days', 1);
            $dueDate = $this->payment->due_date->format('d M Y');

            $formattedNominal = 'Rp ' . number_format($this->payment->nominal, 0, ',', '.');

            if ($this->type === 'deadline') {
                $title = 'Pengingat Deadline Pembayaran';
                $body = "Tagihan '{$this->payment->title}' ({$formattedNominal}) untuk anak Anda akan berakhir dalam {$reminderDays} hari pada {$dueDate}";
            }

            $data = [
                'type' => 'payment_deadline',
                'payment_id' => (string) $this->payment->id,
                'title' => $this->payment->title,
                'nominal' => (string) $this->payment->nominal,
                'due_date' => $this->payment->due_date->format('Y-m-d H:i:s'),
                'action' => 'view_payment'
            ];

            $firebaseService->sendToDevice(
                $this->parentUser->notification_key,
                $title,
                $body,
                $data
            );

            Log::info('Payment reminder sent successfully', [
                'type' => $this->type,
                'user_id' => $this->parentUser->id,
                'payment_id' => $this->payment->id
            ]);
        } catch (\Throwable $th) {
            Log::error('Gagal kirim payment reminder', [
                'user_id' => $this->parentUser->id,
                'payment_id' => $this->payment->id,
                'error' => $th->getMessage()
            ]);

            // Re-throw exception agar job bisa di-retry
            throw $th;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Job PaymentDeadlineReminder failed', [
            'payment_id' => $this->payment->id,
            'user_id' => $this->parentUser->id,
            'error' => $exception->getMessage()
        ]);
    }
}
