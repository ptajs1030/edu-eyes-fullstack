<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendPaymentRealTimeNotification implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

    protected $payment;
    protected $parentUser;
    protected $type;

    /**
     * Create a new job instance.
     */
    public function __construct(Payment $payment, User $parentUser, string $type)
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

            $dueDate = $this->payment->due_date->format('d M Y');
            $nominal = number_format($this->payment->nominal, 0, ',', '.');
            $academicYear = $this->payment->academicYear->name ?? 'Tahun Ajaran';

            $formattedNominal = 'Rp ' . number_format($this->payment->nominal, 0, ',', '.');

            if ($this->type === 'created') {
                $title = 'Tagihan Baru Ditambahkan';
                $body = "Tagihan '{$this->payment->title}' ({$formattedNominal}) telah ditambahkan untuk anak Anda.";
            } elseif ($this->type === 'manual') {
                $title = 'Pengingat Tagihan';
                $body = "Pengingat: Tagihan '{$this->payment->title}' ({$academicYear}) sebesar Rp {$nominal} untuk anak Anda. Deadline: {$dueDate}";
            } else {
                Log::warning("Type tidak sesuai: {$this->type}");
                return;
            }

            $data = [
                'type' => 'payment_' . $this->type,
                'payment_id' => (string) $this->payment->id,
                'title' => $this->payment->title,
                'nominal' => (string) $this->payment->nominal,
                'formatted_nominal' => $formattedNominal,
                'due_date' => $this->payment->due_date->format('Y-m-d'),
                'action' => 'view_payment'
            ];

            // Kirim notifikasi via Firebase
            $firebaseService->sendToDevice(
                $this->parentUser->notification_key,
                $title,
                $body,
                $data
            );

            Log::info('Payment real-time notification sent', [
                'type' => $this->type,
                'user_id' => $this->parentUser->id,
                'payment_id' => $this->payment->id
            ]);
        } catch (Throwable $th) {
            Log::error('Gagal kirim payment real-time notification', [
                'user_id' => $this->parentUser->id,
                'payment_id' => $this->payment->id,
                'error' => $th->getMessage()
            ]);

            throw $th;
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Job SendPaymentRealTimeNotification failed', [
            'payment_id' => $this->payment->id,
            'user_id' => $this->parentUser->id,
            'error' => $exception->getMessage()
        ]);
    }
}
