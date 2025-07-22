<?php

namespace Database\Seeders;

use App\Models\CustomDayOff;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CustomDayOffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dayOffs = [
            ['date' => '2025-01-01', 'description' => 'Tahun Baru Masehi'],
            ['date' => '2025-01-29', 'description' => 'Tahun Baru Imlek 2576'],
            ['date' => '2025-03-31', 'description' => 'Hari Raya Nyepi'],
            ['date' => '2025-04-17', 'description' => 'Waisak'],
            ['date' => '2025-05-01', 'description' => 'Hari Buruh Internasional'],
            ['date' => '2025-05-29', 'description' => 'Kenaikan Isa Almasih'],
            ['date' => '2025-06-06', 'description' => 'Hari Lahir Pancasila'],
            ['date' => '2025-07-17', 'description' => 'Idul Adha 1446 H'],
            ['date' => '2025-07-30', 'description' => 'Tahun Baru Islam 1447 H'],
            ['date' => '2025-08-17', 'description' => 'Hari Kemerdekaan RI'],
            ['date' => '2025-10-06', 'description' => 'Maulid Nabi Muhammad SAW'],
            ['date' => '2025-12-25', 'description' => 'Hari Raya Natal'],
        ];

        foreach ($dayOffs as $dayOff) {
            CustomDayOff::create($dayOff);
        }
    }
}
