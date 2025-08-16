<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Payment;
use App\Models\PaymentAssignment;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PaymentSeeder extends Seeder
{
    public function run()
    {
        // Pastikan ada data tahun akademik dan siswa terlebih dahulu
        $academicYears = AcademicYear::all();
        $students = Student::all();

        if ($academicYears->isEmpty() || $students->isEmpty()) {
            $this->command->error('Harap jalankan AcademicYearSeeder dan StudentSeeder terlebih dahulu!');
            return;
        }

        // Data pembayaran
        $payments = [
            [
                'title' => 'Uang Pangkal',
                'description' => 'Pembayaran uang pangkal masuk sekolah',
                'nominal' => 5000000,
                'due_date' => Carbon::now()->addMonth(),
            ],
            [
                'title' => 'SPP Bulanan',
                'description' => 'Pembayaran SPP bulan Januari',
                'nominal' => 750000,
                'due_date' => Carbon::now()->startOfMonth(),
            ],
            [
                'title' => 'SPP Bulanan',
                'description' => 'Pembayaran SPP bulan Februari',
                'nominal' => 750000,
                'due_date' => Carbon::now()->startOfMonth()->addMonth(),
            ],
            [
                'title' => 'Uang Seragam',
                'description' => 'Pembayaran seragam sekolah',
                'nominal' => 1500000,
                'due_date' => Carbon::now()->addDays(15),
            ],
            [
                'title' => 'Uang Kegiatan',
                'description' => 'Pembayaran untuk kegiatan sekolah',
                'nominal' => 500000,
                'due_date' => Carbon::now()->addMonths(2),
            ],
        ];

        foreach ($academicYears as $year) {
            foreach ($payments as $paymentData) {
                $payment = Payment::create([
                    'academic_year_id' => $year->id,
                    'title' => $paymentData['title'],
                    'description' => $paymentData['description'],
                    'nominal' => $paymentData['nominal'],
                    'due_date' => $paymentData['due_date'],
                ]);

                // Assign pembayaran ke semua siswa
                foreach ($students as $student) {
                    $paymentAssignment = PaymentAssignment::create([
                        'payment_id' => $payment->id,
                        'student_id' => $student->id,
                        'payment_date' => rand(0, 1) ? Carbon::now()->subDays(rand(1, 30)) : null,
                    ]);
                }
            }
        }

        $this->command->info('Berhasil menambahkan data pembayaran dan assignment!');
    }
}