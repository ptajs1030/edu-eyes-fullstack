<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nip')->nullable()->after('email'); // sesuaikan posisi jika perlu
            $table->string('job')->nullable()->after('nip');
            $table->string('position')->nullable()->after('job');
            $table->text('profile_picture')->nullable()->after('position');
            $table->text('address')->nullable()->after('profile_picture');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nip', 'job', 'position', 'profile_picture', 'address']);
        });
    }
};
