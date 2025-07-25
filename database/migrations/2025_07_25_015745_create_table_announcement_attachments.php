<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('announcement_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')
                ->constrained('announcements')
                ->onDelete('cascade');
            $table->text('url'); // input string manual
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('announcement_attachments');
    }
};
