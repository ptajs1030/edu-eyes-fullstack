<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Rename column
            $table->renameColumn('code', 'nis');

            // Add new nullable column
            $table->text('profile_picture')->nullable()->after('full_name');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Rollback changes
            $table->renameColumn('nis', 'code');
            $table->dropColumn('profile_picture');
        });
    }
};
