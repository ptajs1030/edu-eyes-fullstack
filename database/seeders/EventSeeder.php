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
            'date' => Carbon::now()->subDays(2),
            'start_hour' => '08:00:00',
            'end_hour' => '12:00:00',
        ]);

        // today event
        Event::create([
            'name' => 'Workshop Kreativitas',
            'description' => 'Workshop untuk mengembangkan kreativitas siswa',
            'date' => Carbon::today(),
            'start_hour' => '10:00:00',
            'end_hour' => '14:00:00',
        ]);

        // upcoming event
        Event::create([
            'name' => 'Lomba Cerdas Cermat',
            'description' => 'Lomba antar kelas untuk meningkatkan pengetahuan umum',
            'date' => Carbon::now()->addDays(7),
            'start_hour' => '09:00:00',
            'end_hour' => '15:00:00',
        ]);
    }
}
