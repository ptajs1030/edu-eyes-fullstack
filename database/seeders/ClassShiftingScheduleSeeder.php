<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\Shifting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClassShiftingScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $morningShift = Shifting::where('name', 'Pagi')->first();
        $dayShift = Shifting::where('name', 'Siang')->first();
        $classVA = Classroom::where('name', 'Class V A')->first();
        $classVIA = Classroom::where('name', 'Class VI A')->first();

        for ($day = 1; $day <= 5; $day++) {
            ClassShiftingSchedule::create([
                'class_id' => $classVA->id,
                'shiftig_id' => $morningShift->id,
                'day' => $day,
            ]);
        }

        for ($day = 1; $day <= 5; $day++) {
            ClassShiftingSchedule::create([
                'class_id' => $classVA->id,
                'shiftig_id' => $dayShift->id,
                'day' => $day,
            ]);
        }
    }
}
