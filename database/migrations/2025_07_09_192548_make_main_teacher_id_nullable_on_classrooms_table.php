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
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropForeign(['main_teacher_id']);
            $table->unsignedBigInteger('main_teacher_id')->nullable()->change();

            $table->foreign('main_teacher_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropForeign(['main_teacher_id']);
            $table->unsignedBigInteger('main_teacher_id')->nullable(false)->change();

            $table->foreign('main_teacher_id')->references('id')->on('teachers')->restrictOnDelete();
        });
    }
};
