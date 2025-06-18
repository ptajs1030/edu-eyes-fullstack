<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ResetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks for truncation
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Truncate tables (in reverse order of dependency to avoid foreign key constraint issues)
        DB::table('shifting_attendances')->truncate();
        DB::table('class_shifting_schedule_pics')->truncate();
        DB::table('class_shifting_schedules')->truncate();
        DB::table('classrooms')->truncate();
        DB::table('students')->truncate();
        DB::table('users')->truncate();
        DB::table('roles')->truncate();
        DB::table('academic_years')->truncate();
        DB::table('settings')->truncate();
        DB::table('shiftings')->truncate();
        DB::table('announcements')->truncate();

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
}
