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
        Schema::create('class_shifting_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('shifting_id');
            $table->integer('day');

            $table->unique(['class_id', 'day']);

            $table->foreign('class_id')->references('id')->on('classrooms');
            $table->foreign('shifting_id')->references('id')->on('shiftings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_shifting_schedules');
    }
};
