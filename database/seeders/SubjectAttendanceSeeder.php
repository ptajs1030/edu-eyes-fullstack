<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassSubjectSchedule;
use App\Models\Student;
use App\Models\SubjectAttendance;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubjectAttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $academicYear = AcademicYear::first();
        $schedules = ClassSubjectSchedule::with(['classroom', 'subject'])->get();
        $students = Student::limit(5)->get();

        if ($academicYear && $schedules->count() > 0 && $students->count() > 0) {
            $statuses = ['present', 'alpha'];
            $startDate = Carbon::now()->subDays(30);

            foreach ($schedules as $schedule) {
                foreach ($students as $student) {
                    // Buat 5 presensi acak untuk setiap siswa di setiap jadwal
                    for ($i = 0; $i < 5; $i++) {
                        $date = $startDate->copy()->addDays(rand(0, 29));

                        // Pastikan hari sesuai dengan jadwal (0-6 = Minggu-Sabtu)
                        while ($date->dayOfWeek != $schedule->day) {
                            $date->addDay();
                        }

                        SubjectAttendance::create([
                            'student_id' => $student->id,
                            'class_id' => $schedule->class_id,
                            'academic_year_id' => $academicYear->id,
                            'subject_name' => $schedule->subject->name,
                            'subject_start_hour' => $schedule->start_hour,
                            'subject_end_hour' => $schedule->end_hour,
                            'submit_date' => $date,
                            'submit_hour' => $schedule->start_hour,
                            'status' => $statuses[array_rand($statuses)],
                            'note' => rand(0, 1) ? 'Hadir tepat waktu' : null,
                        ]);
                    }
                }
            }

            $this->command->info('Subject attendances seeded successfully!');
        } else {
            $this->command->error('Required data not found! Please seed academic years, class subject schedules and students first.');
        }
    }
}
