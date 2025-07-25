<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('short_content')->nullable()->after('title');
            $table->dropColumn('picture'); // pastikan kolom ini memang sudah ada sebelumnya
        });
    }

    public function down(): void {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn('short_content');
            $table->string('picture')->nullable(); // rollback restore picture
        });
    }
};
