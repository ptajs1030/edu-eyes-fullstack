<?php

namespace App\Services;


use App\DTOs\ShiftingAttendanceData;
use App\Models\ClassShiftingSchedulePic;
use App\Models\Setting;
use App\Models\Shifting;
use App\Models\ShiftingAttendance;
use Carbon\Carbon;


class AttendanceService
{
    public function attendanceHistory($date){
        $attendances = ShiftingAttendance::where('submit_date', Carbon::now()->format('Y-m-d'))->get();
        $date=Carbon::parse($date)->format('Y-m-d');

        if($date){
            $attendances = ShiftingAttendance::where('submit_date', $date)->get();
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
        $pic = ClassShiftingSchedulePic::where('teacher_id', auth()->id())->value('class_shifting_schedule_id');
        $attendace=ShiftingAttendance::where('student_id', $data->getStudent())->first();
        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value('value');
        $start_hour = Carbon::parse(Shifting::where('id', $attendace->id)->value('start_hour'));
        $deadline=$start_hour->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        
        

        if(!$attendace){
            abort(404, 'Student not found');
        }else if($attendace->id != $pic){
            abort(403, 'You are not allowed to access this student');
        }

        if ($submit_hour > $deadline) {
            $attendace->update([
                'status' => 'late',
                'minutes_of_late' => $submit_hour->diffInMinutes($deadline),
                'submit_hour' => $submit_hour->format('H:i'),
            ]);
        }else {
            $attendace->update([
                'status' => 'present',
                'submit_hour' => $submit_hour->format('H:i'),
            ]);
        }

        return $attendace;

        
    }
}