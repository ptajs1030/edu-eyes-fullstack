<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Payment;
use App\Models\PaymentAssignment;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Dapatkan tahun akademik aktif
        $academicYear = AcademicYear::where('status', 'active')->first();
        
        if (!$academicYear) {
            $this->command->error('Tidak ada tahun akademik aktif ditemukan!');
            return;
        }

        // 2. Buat beberapa jenis pembayaran
        $payments = [
            [
                'title' => 'SPP Bulanan',
                'description' => 'Pembayaran SPP bulanan untuk siswa',
                'nominal' => 500000,
                'due_date' => Carbon::now()->addDays(10),
            ],
            [
                'title' => 'Uang Gedung',
                'description' => 'Pembayaran uang gedung tahunan',
                'nominal' => 2000000,
                'due_date' => Carbon::now()->addDays(30),
            ],
            [
                'title' => 'Uang Seragam',
                'description' => 'Pembayaran untuk seragam sekolah',
                'nominal' => 750000,
                'due_date' => Carbon::now()->addDays(15),
            ],
            [
                'title' => 'Uang Kegiatan',
                'description' => 'Pembayaran untuk kegiatan ekstrakurikuler',
                'nominal' => 300000,
                'due_date' => Carbon::now()->addDays(20),
            ]
        ];

        foreach ($payments as $paymentData) {
            // 3. Buat record payment
            $payment = Payment::create([
                'academic_year_id' => $academicYear->id,
                'title' => $paymentData['title'],
                'description' => $paymentData['description'],
                'nominal' => $paymentData['nominal'],
                'due_date' => $paymentData['due_date'],
                'payment_date' => rand(0, 1) ? Carbon::now() : null // 50% chance sudah dibayar
            ]);

            // 4. Ambil beberapa siswa secara acak
            $students = Student::inRandomOrder()->limit(rand(5, 10))->get();

            foreach ($students as $student) {
                // 5. Assign pembayaran ke siswa
                PaymentAssignment::create([
                    'payment_id' => $payment->id,
                    'student_id' => $student->id
                ]);
            }
        }

        $this->command->info('Berhasil seeding data pembayaran dan assignment!');
    }
}