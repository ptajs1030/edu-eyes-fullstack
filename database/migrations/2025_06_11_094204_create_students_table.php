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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->string('full_name');
            $table->string('code')->nullable();
            $table->year('entry_year');
            $table->enum('gender', ['male', 'female']);
            $table->enum('status', ['active', 'graduated', 'inactive']);
            $table->string('religion');
            $table->string('birth_place');
            $table->date('date_of_birth');
            $table->string('addresss');
            $table->string('qr_code_url')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('users');
            $table->foreign('class_id')->references('id')->on('classrooms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
