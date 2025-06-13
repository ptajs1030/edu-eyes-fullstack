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
        Schema::create('shifting_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('class_shifting_schedule_id');
            $table->date('submit_date');
            $table->time('submit_hour')->nullable();
            $table->enum('status', ['present', 'present_in_tolerance', 'absent', 'late', 'alpha'])->default('alpha');
            $table->integer('minutes_of_late')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('users');
            $table->foreign('class_shifting_schedule_id')->references('id')->on('class_shifting_schedules');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifting_attendances');
    }
};
