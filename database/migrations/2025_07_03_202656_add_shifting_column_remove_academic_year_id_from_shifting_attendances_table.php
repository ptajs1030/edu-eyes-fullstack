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

            // drop foreign key
            $table->dropForeign(['class_shifting_schedule_id']);
            $table->dropColumn('class_shifting_schedule_id');

            // add new column
            $table->unsignedBigInteger('class_id')->after('student_id');
            $table->unsignedBigInteger('academic_year_id')->after('class_id');
            $table->string('shifting_name')->after('academic_year_id');
            $table->time('shifting_start_hour')->after('shifting_name');
            $table->time('shifting_end_hour')->after('shifting_start_hour');

            $table->foreign('class_id')->references('id')->on('classrooms');
            $table->foreign('academic_year_id')->references('id')->on('academic_years');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifting_attendances', function (Blueprint $table) {
            // Drop new column
            $table->dropForeign(['class_id']);
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn(['class_id', 'academic_year_id', 'shifting_name', 'shifting_start_hour', 'shifting_end_hour']);

            // restore deleted column
            $table->unsignedBigInteger('class_shifting_schedule_id')->nullable();
            $table->foreign('class_shifting_schedule_id')->references('id')->on('class_shifting_schedules');
        });
    }
};
