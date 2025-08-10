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
        // Add payment_date to payment_assignments table
        Schema::table('payment_assignments', function (Blueprint $table) {
            $table->date('payment_date')->nullable()->after('student_id');
        });

        // Remove payment_date from payments table
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add payment_date back to payments table
        Schema::table('payments', function (Blueprint $table) {
            $table->date('payment_date')->nullable()->after('due_date');
        });

        // Remove payment_date from payment_assignments table
        Schema::table('payment_assignments', function (Blueprint $table) {
            $table->dropColumn('payment_date');
        });
    }
};
