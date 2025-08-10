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
        Schema::create('temporary_class_statuses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('class_id');
            $table->enum('status', ['draft', 'completed'])->default('draft');

            $table->foreign('class_id')->references('id')->on('classrooms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temporary_class_statuses');
    }
};
