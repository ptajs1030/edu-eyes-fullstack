<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\User;
use App\Models\Role;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    protected static ?string $password;
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // truncate all table before seeding
        Announcement::truncate();
        User::truncate();

        // truncate table roles cleanly
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('roles')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');


        // Seed Fixed Role
        $admin = Role::create([
            'id' => 1,
            'name' => 'admin',
        ]);
        Role::create([
            'id' => 2,
            'name' => 'teacher',
        ]);
        Role::create([
            'id' => 3,
            'name' => 'parent',
        ]);

        // Seed Fixed Super Admin
        User::create([
            'full_name' => 'Admin School',
            'username' => 'superadmin',
            'email' => 'superadmin@gmail.com',
            'role_id' => 1,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'status' => 'active',
            'remember_token' => Str::random(10),
        ]);

        // Seed Factory 10 Teachers
        User::factory(10)->create([
            'role_id' => 2
        ]);

        // Seed Factory 10 Parents
        User::factory(10)->create([
            'role_id' => 3
        ]);

        // Seed Factory 1000 Announcement
        Announcement::factory(1000)->create();
    }
}
