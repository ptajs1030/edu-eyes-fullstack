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
            $table->renameColumn('submit_hour', 'clock_in_hour');

            $table->time('clock_out_hour')->nullable()->after('clock_in_hour');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifting_attendances', function (Blueprint $table) {
            $table->renameColumn('clock_in_hour', 'submit_hour');

            $table->dropColumn('clock_out_hour');
        });
    }
};
