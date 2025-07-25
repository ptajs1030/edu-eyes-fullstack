<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exam_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classrooms')->onDelete('cascade');
            $table->string('class_name'); // string instead of joining
            $table->decimal('score', 5, 2)->unsigned(); // misalnya 100.00 max
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('exam_assignments');
    }
};
