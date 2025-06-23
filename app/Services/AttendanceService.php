<?php

namespace App\Services;


use App\DTOs\ShiftingAttendanceData;
use App\Models\ClassShiftingSchedule;
use App\Models\ClassShiftingSchedulePic;
use App\Models\Setting;
use App\Models\Shifting;
use App\Models\ShiftingAttendance;
use Carbon\Carbon;


class AttendanceService
{
    public function attendanceHistory($date, $class_id){
       
        $query = ShiftingAttendance::query();

        if ($date && $date !== 'null') {
            $parsedDate = Carbon::parse($date)->format('Y-m-d');
            $query->where('submit_date', $parsedDate);
        }
    
        if ($class_id) {
            $query->whereHas('classShiftingSchedule', function ($q) use ($class_id) {
                $q->where('class_id', $class_id);
            });
        }
        $query->where('clock_out_hour', '!=', null);
              
        $attendances = $query->paginate(10);

        if ($attendances->isEmpty()) {
            abort(204, "Data Kosong"); 
        }

        

        return [
            'number_of_attendances' => $attendances->total(),
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
            'attendances' => $attendances->items(),
        ];
    }

    public function shiftingAttendance($student_id){
        $day= ClassShiftingSchedule::where('day', Carbon::now()->dayOfWeek)->first();
        
        $pic = ClassShiftingSchedulePic::where('class_shifting_schedule_id', $day->id)->where('teacher_id', auth()->user()->id)->value('class_shifting_schedule_id');

        $attendace=ShiftingAttendance::where('student_id', $student_id)->first();
        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value('value');
        $class_shifting_schedule=ClassShiftingSchedule::where('id', $attendace->class_shifting_schedule_id)->first();
        $start_hour_raw = Shifting::where('id', $class_shifting_schedule->shifting_id)->value('start_hour');
        $start_hour = Carbon::parse(Carbon::today()->format('Y-m-d') . ' ' . $start_hour_raw, 'Asia/Jakarta');
        $deadline = $start_hour->copy()->addMinutes($late_tolerance);
        $submit_hour = Carbon::now()->setTimezone('Asia/Jakarta');

        $minutes_of_late = $deadline->diffInMinutes($submit_hour);

dd($pic, $attendace);
      
        if(!$attendace){
            abort(404, 'Student not found');
        }else if($attendace->class_shifting_schedule_id != $pic){
            abort(403, 'You are not allowed to access this student');
        }

        if ($submit_hour <= $deadline && !$attendace->clock_in_hour) {
            $attendace->update([
                'status' => 'present',
                'clock_in_hour' => $submit_hour->format('H:i'),
            ]);
        }else if ($submit_hour > $deadline && !$attendace->clock_in_hour) {

            $attendace->update([
                'status' => 'late',
                'minutes_of_late' => (int) $minutes_of_late,
                'clock_in_hour' => $submit_hour->format('H:i'),
            ]);
        }else {
            $attendace->update([
                'clock_out_hour' => $submit_hour->format('H:i'),
               
            ]);
        }

       

        return [
            'message' => 'Attendance updated successfully',
            'attendance' => $attendace,
        ];

        
    }
}