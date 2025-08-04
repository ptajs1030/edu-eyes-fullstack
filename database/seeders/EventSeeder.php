<?php

namespace Database\Seeders;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // past event
        Event::create([
            'name' => 'Seminar Pendidikan Karakter',
            'description' => 'Seminar untuk meningkatkan karakter siswa',
            'start_date' => Carbon::now()->subDays(2),
            'end_date' => Carbon::now()->subDays(1),
            'start_hour' => '08:00:00',
            'end_hour' => '12:00:00',
        ]);

        // today event
        Event::create([
            'name' => 'Workshop Kreativitas',
            'description' => 'Workshop untuk mengembangkan kreativitas siswa',
            'start_date' => Carbon::today(),
            'end_date' => Carbon::now()->addDays(3),
            'start_hour' => '10:00:00',
            'end_hour' => '14:00:00',
        ]);

        // upcoming event
        Event::create([
            'name' => 'Lomba Cerdas Cermat',
            'description' => 'Lomba antar kelas untuk meningkatkan pengetahuan umum',
            'start_date' => Carbon::now()->addDays(7),
            'end_date'=>Carbon::now()->addDays(10),
            'start_hour' => '09:00:00',
            'end_hour' => '15:00:00',
        ]);
    }
}
