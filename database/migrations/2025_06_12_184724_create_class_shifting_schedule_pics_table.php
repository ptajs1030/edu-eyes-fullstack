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
        Schema::create('class_shifting_schedule_pics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('class_shifting_schedule_id');
            $table->unsignedBigInteger('teacher_id');

            $table->foreign('class_shifting_schedule_id')->references('id')->on('class_shifting_schedules');
            $table->foreign('teacher_id')->references('id')->on('users');

            $table->unique(['class_shifting_schedule_id', 'teacher_id'], 'class_shifting_schedule_pics_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_shifting_schedule_pics');
    }
};
