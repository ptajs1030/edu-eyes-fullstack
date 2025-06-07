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
        Schema::table('users', function (Blueprint $table) {
            // rename column name -> full_name
            $table->renameColumn('name', 'full_name');

            // add column
            $table->string('username')->after('full_name')->unique();
            $table->string('phone')->nullable()->after('username')->unique();
            $table->enum('status', ['active', 'inactive'])->after('phone');
            $table->string('notification_key')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('full_name', 'name');
            $table->dropColumn(['username', 'phone', 'status', 'notification_key']);
        });
    }
};
