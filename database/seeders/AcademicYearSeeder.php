<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AcademicYear::create([
            'start_year' => 2024,
            'title' => '2024/2025',
            'status' => 'active',
            'attendance_mode' => 'per-shift',
            'note' => 'Seed academic year for 2024-2025'
        ]);
    }
}
