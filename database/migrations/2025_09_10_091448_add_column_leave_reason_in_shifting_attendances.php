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
        Schema::table('shifting_attendances', function (Blueprint $table) {
            $table->text('leave_reason')->after('day_off_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifting_attendances', function (Blueprint $table) {
            $table->dropColumn('leave_reason');
        });
    }
};
