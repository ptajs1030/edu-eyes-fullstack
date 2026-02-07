<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BulkUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', 'admin')->first();
        $teacherRole = Role::where('name', 'teacher')->first();
        $parentRole = Role::where('name', 'parent')->first();

        // Generate 30 Admins
        for ($i = 1; $i <= 30; $i++) {
            User::create([
                'full_name' => "Admin $i",
                'username' => "admin$i",
                'email' => "admin$i@school.com",
                'password' => bcrypt('eduEyes123'),
                'role_id' => $adminRole->id,
                'email_verified_at' => now(),
                'status' => 'active',
                'remember_token' => Str::random(10),
            ]);
        }

        // Generate 30 Teachers
        for ($i = 1; $i <= 30; $i++) {
            User::create([
                'full_name' => "Guru $i",
                'username' => "guru$i",
                'email' => "guru$i@school.com",
                'password' => bcrypt('eduEyes123'),
                'role_id' => $teacherRole->id,
                'email_verified_at' => now(),
                'status' => 'active',
                'remember_token' => Str::random(10),
            ]);
        }

        // Generate 30 Parents
        for ($i = 1; $i <= 30; $i++) {
            User::create([
                'full_name' => "Orang Tua $i",
                'username' => "ortu$i",
                'email' => "ortu$i@school.com",
                'password' => bcrypt('eduEyes123'),
                'role_id' => $parentRole->id,
                'email_verified_at' => now(),
                'status' => 'active',
                'remember_token' => Str::random(10),
            ]);
        }
    }
}
