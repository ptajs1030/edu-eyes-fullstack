<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('temporary_class_students', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('academic_year_id');
            $table->unsignedBigInteger('initial_class_id');
            $table->unsignedBigInteger('target_class_id');
            $table->boolean('is_graduate')->default(false);

            $table->foreign('student_id')->references('id')->on('students');
            $table->foreign('academic_year_id')->references('id')->on('academic_years');
            $table->foreign('initial_class_id')->references('id')->on('classrooms');
            $table->foreign('target_class_id')->references('id')->on('classrooms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temporary_class_students');
    }
};
