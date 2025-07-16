<?php

namespace App\Services;


use App\DTOs\EditEventAttendanceData;
use App\DTOs\EditShiftingAttendanceData;
use App\DTOs\EditSubjectAttendanceData;
use App\DTOs\EventAttendanceData;
use App\DTOs\ShiftingAttendanceData;
use App\DTOs\SubjectAttendanceData;
use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\ClassShiftingSchedulePic;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventPic;
use App\Models\Setting;
use App\Models\Shifting;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use App\Models\SubjectAttendance;
use Carbon\Carbon;


class AttendanceService
{
    public function shiftingAttendanceHistory($date, $class_id, $type = 'in', $search)
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
        if ($search) {
            $query->whereHas('student', function($q) use ($search){
                $q->where('full_name', 'like', "%$search%");
            });
        }
        $attendances = $query->with('classroom', 'student')->paginate(10);
        
        if ($attendances->isEmpty()) {
            abort(204, "Data Kosong");
        }
        
        $attendancesWithClassroom = [];
        foreach ($attendances->items() as $attendance) {
            $attendancesWithClassroom[] = [
                'id' => $attendance->id,
                'student_name' => optional($attendance->student)->full_name,
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
        $student=Student::where('uuid', $data->getStudent())->first();
        if (!$student) {
            abort(404, 'Student not found');
        }
        $attendance=ShiftingAttendance::where('student_id', $student->id)->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendance) {
            abort(404, 'Attendance not found');
        }
        $day=ClassShiftingSchedule::where('class_id', $student->class_id)->where('day', Carbon::now()->dayOfWeek())->first();
        if(!$day){
            abort(404, 'No class schedule found for today.');
        }
        $pics=ClassShiftingSchedulePic::where('class_shifting_schedule_id', $day->id)->get();
        if ($pics->isEmpty()) {
            abort(404, 'PIC not found');
        }
        

        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value        ('value');
        $deadline = Carbon::parse($attendance->shifting_start_hour)->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        $minutes_of_late = $deadline->diffInMinutes($data->getSubmitHour());
        $isPic = $pics->contains('teacher_id', auth()->user()->id);
        if (!$isPic) {
            abort(403, 'You are not assigned to this class schedule.');
        }
        if ($attendance->clock_out_hour && $attendance->clock_in_hour) {
            return abort(400, 'attendance already submitted');
        }

        if ($attendance->clock_in_hour && !$attendance->clock_out_hour) {
            $minClockOut = Carbon::parse($attendance->clock_in_hour)->addMinutes(2);

            if ($submit_hour->lt($minClockOut)) {
                abort(400, 'Clock out must be at least 2 minutes after clock in');
            }
        }
        if ($submit_hour <= $deadline && !$attendance->clock_in_hour) {
            $attendance->update([
                'status' => 'present',
                'clock_in_hour' => $submit_hour
            ]);
            
        }else if ($submit_hour > $deadline && !$attendance->clock_in_hour) {
            $attendance->update([
                'status' => 'late',
                'minutes_of_late' => (int) $minutes_of_late,
                'clock_in_hour' => $submit_hour,
            ]);
            
        }else {
            $attendance->update([
                'clock_out_hour' => $submit_hour,
            ]);
            
        }

        return [
            'message' => 'Attendance updated successfully',
            'attendance' => $attendance,
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
                'academic_year'=> optional($attendance->academicYear)->title,
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

    public function getClassroomByTeacher($search){
        $query= Classroom::where('main_teacher_id', auth()->user()->id);
        if ($search) {
            $query->where('name', 'like', "%$search%");
        }
        $classrooms = $query->get();
        if ($classrooms->isEmpty()) {
            abort(204, 'Classroom not found');
        }
        return $classrooms;
        
    }

    public function getClassroomSubject($class_id, $search = null){
        $query = SubjectAttendance::where('class_id', $class_id)
        ->where('submit_date', Carbon::now()->format('Y-m-d'));


        if ($search) {
            $query->where('subject_name', 'like', "%$search%");
        }

        $schedules = $query->distinct()->pluck('subject_name');

        if ($schedules->isEmpty()) {
            abort(204, 'Schedule not found');
        }
        return $schedules;
    }
    public function getSubjectAttendance($class_id, $subject){
        $attendances=SubjectAttendance::where('class_id', $class_id)->where('subject_name', $subject)->where('submit_date', Carbon::now()->format('Y-m-d'))->with('classroom', 'student', 'academicYear')->get();
        if ($attendances->isEmpty()) {
            abort(204, 'Attendance not found');
        }
        $attendancesWithRelations=[];
        foreach ($attendances as $attendance) {
            $attendancesWithRelations[]=[
                'id' => $attendance->id,
                'student' => optional($attendance->student)->full_name,
                'classroom' => optional($attendance->classroom)->name,
                'academic_year'=> optional($attendance->academicYear)->title,
                'subject_name' => $attendance->subject_name,
                'subject_start_hour' => $attendance->subject_start_hour,
                'subject_end_hour' => $attendance->subject_end_hour,
                'submit_date' => $attendance->submit_date,
                'submit_hour'=> $attendance->submit_hour,
                'status' => $attendance->status,
                'note'=>$attendance->note,
            ];
        }
        return $attendancesWithRelations;
    }

    public function subjectAttendance(SubjectAttendanceData $data){ 
        $attendances=SubjectAttendance::whereIn('id', $data->getAttendanceIdList())->where('submit_date', Carbon::now()->format('Y-m-d'))->with('classroom')->get();
        
        foreach ($attendances as $attendance) {
            if($attendance->classroom->main_teacher_id != auth()->user()->id){
                abort(403, 'You are not assigned to this class schedule.');
            }
            $attendance->update([
               'status'=>'present',
               'submit_hour'=>Carbon::parse($data->getSubmitHour())->format('H:i:s') 
            ]);
        }

        return [
            'message' => 'Attendance updated successfully',
            'attendance' => $attendances,
        ];
    }

    public function editSubjectAttendance(EditSubjectAttendanceData $data, $id){
        $attendance=SubjectAttendance::where('id', $id)->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendance) {
            abort(404, 'Attendance not found');
        }
        if($attendance->submit_date != Carbon::now()->format('Y-m-d')){
            abort(403, 'You are not allowed to edit this attendance');
        }
        $teacher=$attendance->classroom->main_teacher;
        if($teacher->id != auth()->user()->id){
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

    public function getEvent($id=null, $date=null){
        if ($id) {
            $event=Event::where('id', $id)->first();
            if(!$event){
                abort(404, 'Event not found');
            }
            return $event;
        }
        if ($date) {
            $event=Event::where('date', $date)->first();
            if(!$event){
                abort(404, 'Event not found');
            }
            return $event;
        }
        $events=Event::all();
        if ($events->isEmpty()) {
            abort(204, 'Event not found');
        }
        return $events;
    }

    public function eventAttendance(EventAttendanceData $data){
        $student=Student::where('uuid', $data->getStudent())->first();
        if (!$student) {
            abort(404, 'Student not found');
        }

        $attendance=EventAttendance::where('student_id', $student->id)->where('event_id', $data->getEvent())->whereDate('submit_date', Carbon::now()->format('Y-m-d'))->with('event')->first();
        if (!$attendance) {
            abort(404, 'Attendance not found');
        }

        $pics=EventPic::where('event_id', $data->getEvent())->get();
        if ($pics->isEmpty()) {
            abort(404, 'PIC not found');
        } 

        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value        ('value');
        $deadline = Carbon::parse($attendance->event->start_hour)->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        $minutes_of_late = $deadline->diffInMinutes($data->getSubmitHour());
        $isPic = $pics->contains('pic_id', auth()->user()->id);
        if (!$isPic) {
            abort(403, 'You are not assigned to this event.');
        }
        if ($attendance->clock_in_hour && $attendance->clock_out_hour) {
            return abort(400, 'attendance already submitted');
        }
        
        if ($attendance->clock_in_hour && !$attendance->clock_out_hour) {
            $minClockOut = Carbon::parse($attendance->clock_in_hour)->addMinutes(2);

            if ($submit_hour->lt($minClockOut)) {
                abort(400, 'Clock out must be at least 2 minutes after clock in');
            }
        }
        if ($submit_hour <= $deadline && !$attendance->clock_in_hour) {
            $attendance->update([
                'status' => 'present',
                'clock_in_hour' => $submit_hour
            ]);
            
        }else if ($submit_hour > $deadline && !$attendance->clock_in_hour) {
            $attendance->update([
                'status' => 'late',
                'minutes_of_late' => (int) $minutes_of_late,
                'clock_in_hour' => $submit_hour,
            ]);
            
        }else {
            $attendance->update([
                'clock_out_hour' => $submit_hour,
            ]);
            
        }

        return [
            'message' => 'Attendance updated successfully',
            'attendance' => $attendance,
        ];

    }

    public function eventAttendanceHistory($search, $date, $event_id){
        $query=EventAttendance::query();
       
        if ($date) {
            if (!preg_match('/^\d{4}-\d{2}$/', $date)) {
                abort(400, 'Format tanggal harus YYYY-MM');
            }
        
            $query->whereRaw("DATE_FORMAT(submit_date, '%Y-%m') = ?", [$date]);
        }
        if ($event_id) {
            $query->where('event_id', $event_id);
        }
        if ($search) {
            $query->whereHas('student', function($q) use ($search){
                $q->where('full_name', 'like', "%$search%");
            });
        }
        $attendances = $query->with('event', 'student.classroom', 'academicYear')->paginate(10);
        
        if ($attendances->isEmpty()) {
            abort(204, "Data Kosong");
        }
        
        $attendancesWithRelations=[];
        foreach ($attendances as $attendance) {
            $attendancesWithRelations[]=[
                'id' => $attendance->id,
                'student' => optional($attendance->student)->full_name,
                'classroom' => optional($attendance->student->classroom)->name,
                'academic_year'=> optional($attendance->student->classroom->academicYear)->title,
                'event_name' => optional($attendance->event)->name,  
                'submit_date'=> $attendance->submit_date,
                'clock_in_hour'=>$attendance->clock_in_hour,
                'clock_out_hour'=>$attendance->clock_out_hour,
                'status'=>$attendance->status,
                'minutes_of_late'=>$attendance->minutes_of_late,
                'note'=>$attendance->note
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

    public function editEventAttendance(EditEventAttendanceData $data, $id){
        $attendance = EventAttendance::where('id', $id)->first();
        if (!$attendance) {
            abort(404, 'Attendance not found');
        }
        if(!Carbon::parse($attendance->submit_date)->isToday()){
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
}