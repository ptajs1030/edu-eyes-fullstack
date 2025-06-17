<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClassroomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // assign main_teacher
        $teacherLisa = User::where('username', 'teacherlisa')->first();
        $teacherBagus = User::where('username', 'teacherbagus')->first();

        Classroom::create([
            'name' => 'Class V A',
            'level' => 5,
            'main_teacher' => $teacherLisa->id,
        ]);
        Classroom::create([
            'name' => 'Class VI A',
            'level' => 6,
            'main_teacher' => $teacherBagus->id,
        ]);
    }
}
