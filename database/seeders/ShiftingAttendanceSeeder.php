<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ShiftingAttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $studentsPerClass = 10;
        $classes = [
            [
                'class_id' => 1,
                'shifting_name' => 'Pagi',
                'shifting_start_hour' => '07:00:00',
                'shifting_end_hour' => '12:00:00',
                'student_start_id' => 1,
            ],
            [
                'class_id' => 2,
                'shifting_name' => 'Siang',
                'shifting_start_hour' => '12:30:00',
                'shifting_end_hour' => '17:30:00',
                'student_start_id' => 11,
            ],
        ];

        $academic_year_id = 1;

        $startDatePresent = Carbon::create(2025, 4, 6);
        $endDatePresent = Carbon::create(2025, 7, 4);

        $startDateAlpha = Carbon::create(2025, 7, 5);
        $endDateAlpha = Carbon::create(2025, 7, 30);

        $presentData = [];
        $alphaData = [];

        // Generate present attendances from startDatePresent to endDatePresent
        for ($date = $startDatePresent->copy(); $date->lte($endDatePresent); $date->addDay()) {
            // Skip Saturday (6) and Sunday (0)
            if (in_array($date->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY])) {
                continue;
            }

            foreach ($classes as $class) {
                for ($i = 0; $i < $studentsPerClass; $i++) {
                    $presentData[] = [
                        'student_id' => $class['student_start_id'] + $i,
                        'class_id' => $class['class_id'],
                        'academic_year_id' => $academic_year_id,
                        'shifting_name' => $class['shifting_name'],
                        'shifting_start_hour' => $class['shifting_start_hour'],
                        'shifting_end_hour' => $class['shifting_end_hour'],
                        'submit_date' => $date->toDateString(),
                        'clock_in_hour' => Carbon::parse($class['shifting_start_hour'])->toTimeString(),
                        'clock_out_hour' => Carbon::parse($class['shifting_end_hour'])->toTimeString(),
                        'minutes_of_late' => null,
                        'status' => 'present', 
                        'note' => null,
                        'day_off_reason' => null,
                        'created_at' => $date->toDateTimeString(),
                        'updated_at' => $date->toDateTimeString(),
                    ];
                }
            }
        }

        // Generate alpha attendances from startDateAlpha to endDateAlpha
        for ($date = $startDateAlpha->copy(); $date->lte($endDateAlpha); $date->addDay()) {
            // Skip Saturday (6) and Sunday (0)
            if (in_array($date->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY])) {
                continue;
            }       
            foreach ($classes as $class) {
                for ($i = 0; $i < $studentsPerClass; $i++) {
                    $alphaData[] = [
                        'student_id' => $class['student_start_id'] + $i,
                        'class_id' => $class['class_id'],
                        'academic_year_id' => $academic_year_id,
                        'shifting_name' => $class['shifting_name'],
                        'shifting_start_hour' => $class['shifting_start_hour'],
                        'shifting_end_hour' => $class['shifting_end_hour'],
                        'submit_date' => $date->toDateString(),
                        'clock_in_hour' => null,
                        'clock_out_hour' => null,
                        'status' => 'alpha',
                        'minutes_of_late' => null,
                        'note' => null,
                        'day_off_reason' => null,
                        'created_at' => $date->toDateTimeString(),
                        'updated_at' => $date->toDateTimeString(),
                    ];
                }
            }
        }
        // merge presentData and alphaData into one array
        $allData = array_merge($presentData, $alphaData);
        DB::table('shifting_attendances')->insert($allData);
    }
}