<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        $classV = Classroom::where('name', 'Class V A')->first();
        $classVI = Classroom::where('name', 'Class VI A')->first();
        $parentRoleID = Role::where('name', 'parent')->first()->id;
        $parentData = User::where('role_id', $parentRoleID)->first();

        // Seed 10 students for Class V A
        for ($i = 0; $i < 10; $i++) {
            Student::create([
                'uuid' => (string) Str::uuid(),
                'parent_id' => $parentData->id,
                'class_id' => $classV->id,
                'full_name' => $faker->name,
                'entry_year' => 2024,
                'gender' => $faker->randomElement(['male', 'female']),
                'status' => 'active',
                'religion' => $faker->randomElement(['islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu']),
                'birth_place' => $faker->randomElement(['jakarta timur', 'jakarta pusat', 'bekasi']),
                'date_of_birth' => $faker->date(),
                'address' => $faker->address,
            ]);
        }

        // Seed 10 students for Class VI A
        for ($i = 0; $i < 10; $i++) {
            Student::create([
                'uuid' => (string) Str::uuid(),
                'parent_id' => User::where('role_id', 3)->first()->id,
                'class_id' => $classVI->id,
                'full_name' => $faker->name,
                'entry_year' => 2024,
                'gender' => $faker->randomElement(['male', 'female']),
                'status' => 'active',
                'religion' => $faker->randomElement(['islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu']),
                'birth_place' => $faker->randomElement(['jakarta timur', 'jakarta pusat', 'bekasi']),
                'date_of_birth' => $faker->date(),
                'address' => $faker->address,
            ]);
        }
    }
}
