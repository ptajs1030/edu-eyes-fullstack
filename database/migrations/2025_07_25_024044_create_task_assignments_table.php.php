<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classrooms')->onDelete('cascade');
            $table->string('class_name');
            $table->decimal('score', 5, 2)->nullable()->unsigned(); // allow null if belum dinilai
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('task_assignments');
    }
};