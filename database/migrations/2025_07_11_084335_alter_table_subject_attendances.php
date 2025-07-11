<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE subject_attendances MODIFY `status` ENUM('present', 'alpha', 'leave', 'sick_leave', 'day_off') DEFAULT 'alpha'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE subject_attendances MODIFY `status` ENUM('present', 'alpha') DEFAULT 'alpha'");
    }
};
