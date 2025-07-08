<?php

namespace App\Services;


use App\DTOs\EditShiftingAttendanceData;
use App\DTOs\ShiftingAttendanceData;
use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\ClassShiftingSchedulePic;
use App\Models\Setting;
use App\Models\Shifting;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use App\Models\SubjectAttendance;
use Carbon\Carbon;


class AttendanceService
{
    public function shiftingAttendanceHistory($date, $class_id, $type = 'in')
    {
        $query=ShiftingAttendance::query();
        if ($date) {
            $parsedDate = Carbon::parse($date)->format('Y-m-d');
            $query->where('submit_date', $parsedDate);
        }
        if ($class_id) {
            $query->where('class_id', $class_id);
        }
        if ($type=='out') {
            $query->whereNotNull('clock_in_hour')
                  ->whereNotNull('clock_out_hour');
        }
        $attendances = $query->with('classroom', 'student')->paginate(10);
        
        if ($attendances->isEmpty()) {
            abort(204, "Data Kosong");
        }
        
        $attendancesWithClassroom = [];
        foreach ($attendances->items() as $attendance) {
            $attendancesWithClassroom[] = [
                'id' => $attendance->id,
                'student_id' => optional($attendance->student)->full_name,
                'classroom' => optional($attendance->classroom)->name,
                'class_shifting_schedule_id' => $attendance->class_shifting_schedule_id,
                'submit_date' => $attendance->submit_date,
                'clock_in_hour' => $attendance->clock_in_hour,
                'clock_out_hour' => $attendance->clock_out_hour,
                'status' => $attendance->status,
                'minutes_of_late' => $attendance->minutes_of_late,
                'note' => $attendance->note,
                'day_off_reason' => $attendance->day_off_reason,
                'created_at' => $attendance->created_at,
                'updated_at' => $attendance->updated_at,
            ];
        }
        return [
            'number_of_attendances' => $attendances->total(),
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
            'attendances' => $attendancesWithClassroom,
        ];
    }
    

    public function shiftingAttendance(ShiftingAttendanceData $data){
        $student=Student::where('id', $data->getStudent())->first();
        if (!$student) {
            abort(404, 'Student not found');
        }
        $day=ClassShiftingSchedule::where('class_id', $student->class_id)->where('day', Carbon::now()->dayOfWeek())->first();
        if(!$day){
            abort(404, 'No class schedule found for today.');
        }
        $pic=ClassShiftingSchedulePic::where('class_shifting_schedule_id', $day->id)->first();
        if (!$pic) {
            abort(404, 'PIC not found');
        }
        $attendace=ShiftingAttendance::where('student_id', $data->getStudent())->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendace) {
            abort(404, 'Attendance not found');
        }

        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value        ('value');
        $deadline = Carbon::parse($attendace->shifting_start_hour)->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        $minutes_of_late = $deadline->diffInMinutes($data->getSubmitHour());
        if ($pic->teacher_id != auth()->user()->id) {
            abort(403, 'You are not assigned to this class schedule.');
        }
        if ($attendace->clock_out_hour) {
            return abort(400, 'attendance already submitted');
        }

        if ($submit_hour <= $deadline && !$attendace->clock_in_hour) {
            $attendace->update([
                'status' => 'present',
                'clock_in_hour' => $submit_hour
            ]);
            
        }else if ($submit_hour > $deadline && !$attendace->clock_in_hour) {
            $attendace->update([
                'status' => 'late',
                'minutes_of_late' => (int) $minutes_of_late,
                'clock_in_hour' => $submit_hour,
            ]);
            
        }else {
            $attendace->update([
                'clock_out_hour' => $submit_hour,
            ]);
            
        }

        return [
            'message' => 'Attendance updated successfully',
            'attendance' => $attendace,
        ];
    }
 
    public function editShiftingAttendance(EditShiftingAttendanceData $data, $attendance_id){
        $attendance=ShiftingAttendance::where('id', $attendance_id)->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendance) {
            abort(404, 'Attendance not found');
        }
        if($attendance->submit_date != Carbon::now()->format('Y-m-d')){
            abort(403, 'You are not allowed to edit this attendance');
        }
        $attendance->update([
            'status' => $data->getStatus(),
        ]);

        return [
            'message' => 'Attendance updated successfully',
            'attendance' => $attendance,
        ];
    }

    public function subjectAttendanceHistory($date, $class_id, $subject){
        $query=SubjectAttendance::query();
        if ($date) {
            $parsedDate = Carbon::parse($date)->format('Y-m-d');
            $query->where('submit_date', $parsedDate);
        }
        if ($class_id) {
            $query->where('class_id', $class_id);
        }
        if ($subject) {
            $query->where('subject_name', $subject);
        }
        
        $attendances = $query->with('classroom', 'student')->paginate(10);
        
        if ($attendances->isEmpty()) {
            abort(204, "Data Kosong");
        }

        $attendancesWithRelations=[];
        foreach ($attendances->items() as $attendance) {
            $attendancesWithRelations[]=[
                'id' => $attendance->id,
                'student' => optional($attendance->student)->full_name,
                'classroom' => optional($attendance->classroom)->name,
                'accademic_year'=> optional($attendance->academicYear)->title,
                'subject_name' => $attendance->subject_name,
                'subject_start_hour' => $attendance->subject_start_hour,
                'subject_end_hour' => $attendance->subject_end_hour,
                'submit_date' => $attendance->submit_date,
                'submit_hour'=> $attendance->submit_hour,
                'status' => $attendance->status,
                'note'=>$attendance->note,
            ];
        }
        return [
            'number_of_attendances' => $attendances->total(),
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
            'attendances' => $attendancesWithRelations,
        ];
    }

    public function getSubjectAttendance($class_id, $subject){
        $attendances=SubjectAttendance::where('class_id', $class_id)->where('subject_name', $subject)->where('submit_date', Carbon::now()->format('Y-m-d'))->get();
        if (!$attendances) {
            abort(204, 'Attendance not found');
        }
        return $attendances;
    }
}