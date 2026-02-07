<?php

use App\Models\Student;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->uuid('uuid')->after('class_id')->unique()->nullable();
        });

        // Generate UUID for existing students
        Student::whereNull('uuid')->get()->each(function ($student) {
            $student->uuid = (string) Str::uuid();
            $student->save();
        });

        // Change UUID to NOT NULL
        Schema::table('students', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
