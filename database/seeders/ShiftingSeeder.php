<?php

namespace Database\Seeders;

use App\Models\Shifting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ShiftingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Shifting::create([
            'name' => 'Pagi',
            'start_hour' => '07:00:00',
            'end_hour' => '12:00:00'
        ]);

        Shifting::create([
            'name' => 'Siang',
            'start_hour' => '12:30:00',
            'end_hour' => '17:30:00'
        ]);
    }
}
