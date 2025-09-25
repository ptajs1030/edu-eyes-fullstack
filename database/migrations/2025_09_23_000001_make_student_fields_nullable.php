<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('religion')->nullable()->change();
            $table->date('date_of_birth')->nullable()->change();
            $table->string('birth_place')->nullable()->change();
            $table->text('address')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('religion')->nullable(false)->change();
            $table->date('date_of_birth')->nullable(false)->change();
            $table->string('birth_place')->nullable(false)->change();
            $table->text('address')->nullable(false)->change();
        });
    }
};
