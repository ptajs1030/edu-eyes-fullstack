<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        $teacherRole = Role::where('name', 'teacher')->first();
        $parentRole = Role::where('name', 'parent')->first();

        // Create users
        User::create([
            'full_name' => 'Admin School',
            'username' => 'superadmin',
            'email' => 'superadmin@gmail.com',
            'password' => bcrypt('password'),
            'role_id' => $adminRole->id,
            'email_verified_at' => now(),
            'status' => 'active',
            'remember_token' => Str::random(10),
        ]);

        User::create([
            'full_name' => 'Teacher Lisa',
            'username' => 'teacherlisa',
            'email' => 'teacherlisa@gmail.com',
            'password' => bcrypt('password'),
            'role_id' => $teacherRole->id,
            'email_verified_at' => now(),
            'status' => 'active',
            'remember_token' => Str::random(10),
        ]);

        User::create([
            'full_name' => 'Teacher Bagus 2',
            'username' => 'teacherbagus',
            'email' => 'teacherbagus@gmail.com',
            'password' => bcrypt('password'),
            'role_id' => $teacherRole->id,
            'email_verified_at' => now(),
            'status' => 'active',
            'remember_token' => Str::random(10),
        ]);

        User::create([
            'full_name' => 'Parent Sari',
            'username' => 'parentsari',
            'email' => 'parentsari@gmail.com',
            'password' => bcrypt('password'),
            'role_id' => $parentRole->id,
            'email_verified_at' => now(),
            'status' => 'active',
            'remember_token' => Str::random(10),
        ]);
    }
}
