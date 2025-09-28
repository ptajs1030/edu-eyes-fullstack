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
        Schema::table('class_histories', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->foreign('student_id')
                ->references('id')->on('students')
                ->onDelete('cascade');
        });

        Schema::table('class_histories', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->foreign('class_id')
                ->references('id')->on('classrooms')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_histories', function (Blueprint $table) {
            // Revert student_id FK to RESTRICT (or NO ACTION)
            $table->dropForeign(['student_id']);
            $table->foreign('student_id')
                ->references('id')->on('students')
                ->onDelete('restrict'); // or ->noAction();
        });

        Schema::table('class_histories', function (Blueprint $table) {
            // Revert class_id FK to RESTRICT (or NO ACTION)
            $table->dropForeign(['class_id']);
            $table->foreign('class_id')
                ->references('id')->on('classrooms')
                ->onDelete('restrict'); // or ->noAction();
        });
    }
};
