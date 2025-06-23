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
    public function attendanceHistory($date){
       
        $date=Carbon::parse($date)->format('Y-m-d');

        if($date){
            $attendances = ShiftingAttendance::where('submit_date', $date)->get();
        }else {
            $attendances = ShiftingAttendance::whereDate('submit_date', Carbon::today())->get();
        }

        if ($attendances->isEmpty()) {
            abort(204, "Data Kosong"); 
        }

        

        return [
            'number_of_attendances' => $attendances->count(),
            'attendances' => $attendances,
        ];
    }

    public function shiftingAttendance(ShiftingAttendanceData $data){
        $day= ClassShiftingSchedule::where('day', Carbon::now()->dayOfWeek)->first();
        
        $pic = ClassShiftingSchedulePic::where('class_shifting_schedule_id', $day->id)->where('teacher_id', auth()->user()->id)->value('class_shifting_schedule_id');

        $attendace=ShiftingAttendance::where('student_id', $data->getStudent())->first();
        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value('value');
        $class_shifting_schedule=ClassShiftingSchedule::where('id', $attendace->class_shifting_schedule_id)->first();
        $start_hour_raw = Shifting::where('id', $class_shifting_schedule->id)->value('start_hour');
        $start_hour = Carbon::parse(Carbon::today()->format('Y-m-d') . ' ' . $start_hour_raw, 'Asia/Jakarta');
        $deadline = $start_hour->copy()->addMinutes($late_tolerance);
        $submit_hour = Carbon::now()->setTimezone('Asia/Jakarta');

        $minutes_of_late = $deadline->diffInMinutes($submit_hour);

        

      
        if(!$attendace){
            abort(404, 'Student not found');
        }else if($attendace->class_shifting_schedule_id != $pic){
            abort(403, 'You are not allowed to access this student');
        }

        if ($submit_hour > $deadline) {
            $attendace->update([
                'status' => 'late',
                'minutes_of_late' => (int) $minutes_of_late,
                'submit_hour' => $submit_hour->format('H:i'),
            ]);
        }else {
            $attendace->update([
                'status' => 'present',
                'submit_hour' => $submit_hour->format('H:i'),
            ]);
        }

        return [
            'message' => 'Attendance updated successfully',
            'attendance' => $attendace,

        ];

        
    }
}