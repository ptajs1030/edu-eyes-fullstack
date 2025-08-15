<?php

namespace Database\Seeders;

use Exception;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    protected static ?string $password;
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            $this->call([
                RoleSeeder::class,
                UserSeeder::class,
                AcademicYearSeeder::class,
                ClassroomSeeder::class,
                AnnouncementSeeder::class,
                StudentSeeder::class,
                SettingSeeder::class,
                ShiftingSeeder::class,
                ClassShiftingScheduleSeeder::class,
                ClassShiftingSchedulePicSeeder::class,
                ShiftingAttendanceSeeder::class,
                SubjectSeeder::class,
                ClassSubjectScheduleSeeder::class,
                SubjectAttendanceSeeder::class,
                EventSeeder::class,
                EventPicSeeder::class,
                EventParticipantSeeder::class,
                EventAttendanceSeeder::class,
                CustomDayOffSeeder::class,
                ExamSeeder::class,
                PaymentSeeder::class,
                TaskSeeder::class
            ]);

            DB::commit();
        } catch (Exception $e) {
            // Rollback the transaction in case of any error
            DB::rollBack();
            // Optionally, log the error or display it
            echo 'Seeding failed: ' . $e->getMessage();
        }
    }
}
