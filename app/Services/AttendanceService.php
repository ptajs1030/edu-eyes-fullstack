<?php

namespace App\Services;


use App\DTOs\EditEventAttendanceData;
use App\DTOs\EditShiftingAttendanceData;
use App\DTOs\EditSubjectAttendanceData;
use App\DTOs\EventAttendanceData;
use App\DTOs\ShiftingAttendanceData;
use App\DTOs\SubjectAttendanceData;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\ClassShiftingSchedulePic;
use App\Models\ClassSubjectSchedule;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventParticipant;
use App\Models\EventPic;
use App\Models\Setting;
use App\Models\Shifting;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectAttendance;
use Carbon\Carbon;
use Illuminate\Console\Scheduling\Schedule;


class AttendanceService
{

    public function todayAttendance(){
        $in=ShiftingAttendance::where('clock_in_hour', '!=', null)
            ->where('clock_out_hour', null)
            ->where('submit_date', Carbon::now()->format('Y-m-d'))
            ->get();
        $out=ShiftingAttendance::where('clock_in_hour', '!=', null)
            ->where('clock_out_hour', '!=', null)
            ->where('submit_date', Carbon::now()->format('Y-m-d'))
            ->get();

        if ($in->isEmpty() && $out->isEmpty()) {
            abort(204, 'Data Kosong');
        }

        return[
            'in' => $in,
            'out' => $out
        ];
    }
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
            abort(404, 'Murid tidak ditemukan');
        }
        $attendance=ShiftingAttendance::where('student_id', $student->id)->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendance) {
            abort(404, 'Absensi tidak ditemukan');
        }
        $day=ClassShiftingSchedule::where('class_id', $student->class_id)->where('day', Carbon::now()->dayOfWeek())->first();
        if(!$day){
            abort(404, 'Jadwal kelas tidak ditemukan untuk hari ini.');
        }
        $pics=ClassShiftingSchedulePic::where('class_shifting_schedule_id', $day->id)->get();
        if ($pics->isEmpty()) {
            abort(404, 'PIC tidak ditemukan');
        }
        

        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value        ('value');
        $deadline = Carbon::parse($attendance->shifting_start_hour)->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        $minutes_of_late = $deadline->diffInMinutes($data->getSubmitHour());
        $isPic = $pics->contains('teacher_id', auth()->user()->id);
        if (!$isPic) {
            abort(403, 'Anda tidak ditugaskan untuk jadwal kelas ini.');
        }
        if ($attendance->clock_out_hour && $attendance->clock_in_hour) {
            return abort(400, 'Absensi sudah diisi');
        }

        if ($attendance->clock_in_hour && !$attendance->clock_out_hour) {
            $minClockOut = Carbon::parse($attendance->clock_in_hour)->addMinutes(2);

            if ($submit_hour->lt($minClockOut)) {
                abort(400, 'Absen keluar harus minimal 2 menit setelah absen masuk');
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
            'message' => 'Absensi berhasil diupdate',
            'attendance' => $attendance,
        ];
    }
 
    public function editShiftingAttendance(EditShiftingAttendanceData $data, $attendance_id){
        $attendance=ShiftingAttendance::where('id', $attendance_id)->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendance) {
            abort(404, 'Absensi tidak ditemukan');
        }
        if($attendance->submit_date != Carbon::now()->format('Y-m-d')){
            abort(403, 'Anda tidak diizinkan untuk mengedit absensi ini');
        }
        $attendance->update([
            'status' => $data->getStatus(),
        ]);

        return [
            'message' => 'Absensi berhasil diupdate',
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
            abort(204, 'Kelas tidak ditemukan');
        }
        return $classrooms;
        
    }

    public function getClassroomSubject($class_id, $search = null){
        $query = ClassSubjectSchedule::where('class_id', $class_id)->where('teacher_id', auth()->user()->id)->with('subject');


        if ($search) {
            $query->whereHas('subject', function($q) use ($search) {
            $q->where('name', 'like', "%$search%");
        });
        }

        $schedules = $query->get();

        if ($schedules->isEmpty()) {
            abort(204, 'Jadwal tidak ditemukan');
        }
        $subjectNames = $schedules->pluck('subject.name')->unique()->values();

        return $subjectNames;
    }
    public function getSubjectAttendance($class_id, $subject){
        $subject = Subject::where('name', $subject)->first();
    
        if (!$subject) {
            abort(404, 'Mata pelajaran tidak ditemukan');
        }


        $classSchedule = ClassSubjectSchedule::where('class_id', $class_id)
            ->where('subject_id', $subject->id)
            ->first();

        if (!$classSchedule) {
            abort(404, 'Jadwal pelajaran tidak ditemukan untuk kelas ini');
        } 
        $attendances = Student::where('class_id', $classSchedule->class_id)->get();
        if ($attendances->isEmpty()) {
            abort(204, 'Absensi tidak ditemukan');
        }
        return $attendances;
    }

    public function subjectAttendance(SubjectAttendanceData $data){ 
        $subject = Subject::where('name', $data->getSubjectName())->firstOrFail();
        $allStudents = Student::where('class_id', $data->getClassId())->get();
  
        $schedule = ClassSubjectSchedule::where('class_id', $data->getClassId())
        ->where('subject_id', $subject->id)
        ->firstOrFail();

        $presentIds = $data->getAttendanceIdList();
        $today = Carbon::now()->format('Y-m-d');

        foreach ($allStudents as $student) {
             $attendance = SubjectAttendance::where('student_id', $student->id)
            ->where('submit_date', $today)
            ->where('subject_name', $subject->name)
            ->first();

            $isPresent = in_array($student->id, $presentIds);
            if ($attendance) {
                if ($attendance->status === 'alpha' && $isPresent) {
                $attendance->update([
                    'status' => 'present',
                    'submit_hour' => $data->getSubmitHour()
                ]);
            }
             continue;
            }
            $status = in_array($student->id, $presentIds) ? 'present' : 'alpha';

            SubjectAttendance::create([
                'student_id' => $student->id,
                'class_id' => $student->class_id,
                'academic_year_id' => AcademicYear::where('status', true)->first()->id,
                'subject_name' => $subject->name,
                'subject_start_hour' => $schedule->start_hour,
                'subject_end_hour' => $schedule->end_hour,
                'submit_date' => $today,
                'submit_hour' => $data->getSubmitHour(),
                'status' => $status,
            ]);
        }

        return [
            'message' => 'Absensi berhasil dibuat',
        ];
    }

    public function editSubjectAttendance(EditSubjectAttendanceData $data, $id){
        $attendance=SubjectAttendance::where('id', $id)->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendance) {
            abort(404, 'Absensi tidak ditemukan');
        }
        if($attendance->submit_date != Carbon::now()->format('Y-m-d')){
            abort(403, 'Anda tidak diizinkan untuk mengedit absensi ini');
        }
        $teacher=$attendance->classroom->main_teacher;
        if($teacher->id != auth()->user()->id){
            abort(403, 'Anda tidak diizinkan untuk mengedit absensi ini');
        }
        $attendance->update([
            'status' => $data->getStatus(),
        ]);
        return [
            'message' => 'Absensi berhasil diupdate',
            'attendance' => $attendance,
        ];
    }

    public function getEvent($id=null, $date){
        $query = Event::query();
        if ($id) {
            $query->where('id', $id);
        }
        if ($date) {
            $parsedDate = Carbon::parse($date);
            $query->whereYear('date', $parsedDate->year)
              ->whereMonth('date', $parsedDate->month);
        }
        $events = $query->paginate(10);
        if ($events->isEmpty()) {
            abort(204, 'Kegiatan tidak ditemukan');
        }
        $eventsWithRelations = [];
        foreach ($events as $event) {
            $eventsWithRelations[] = [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'date' => $event->date,
                'start_time' => $event->Start_hour,
                'end_time' => $event->end_hour,
            ];
        }
        return [
            'current_page' => $events->currentPage(),
            'last_page' => $events->lastPage(),
            'per_page' => $events->perPage(),
            'events' => $eventsWithRelations,
        ];
    }
    public function eventAttendance(EventAttendanceData $data){
        $student=Student::where('uuid', $data->getStudent())->first();
        if (!$student) {
            abort(404, 'Siswa tidak ditemukan');
        }
        
       $participant=EventParticipant::where('student_id', $student->id)
            ->where('event_id', $data->getEvent())->with('event')
            ->first();
           
        if (!$participant) {
            abort(404, 'Peserta tidak ditemukan');
        }

        $pics=EventPic::where('event_id', $data->getEvent())->get();
        if ($pics->isEmpty()) {
            abort(404, 'PIC tidak ditemukan');
        } 
        $attendance=EventAttendance::where('student_id', $student->id)
            ->where('event_id', $data->getEvent())
            ->where('submit_date', Carbon::now()->format('Y-m-d'))
            ->first();
        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value        ('value');
        $deadline = Carbon::parse($participant->event->start_hour)->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        $minutes_of_late = $deadline->diffInMinutes($data->getSubmitHour());
        $isPic = $pics->contains('pic_id', auth()->user()->id);
        if (!$isPic) {
            abort(403, 'Anda tidak ditugaskan untuk kegiatan ini.');
        }
       
        if ($attendance) {
            if ($attendance->clock_in_hour && $attendance->clock_out_hour == '00:00:00') {
            $minClockOut = Carbon::parse($attendance->clock_in_hour)->addMinutes(2);
            if ($submit_hour->lt($minClockOut)) {
                abort(400, 'Absen keluar harus minimal 2 menit setelah absen masuk');
            }
            $attendance->update([
                'clock_out_hour' => $submit_hour->format('H:i:s'),
            ]);
            return $attendance;
        } else {
           
            abort(400, 'Absensi sudah diisi');
        }
        } else {
        
            $status = $submit_hour <= $deadline ? 'present' : 'late';
            $attendance = EventAttendance::create([
                'student_id' => $student->id,
                'event_id' => $data->getEvent(),
                'academic_year_id' => AcademicYear::where('status', true)->first()->id,
                'submit_date' => Carbon::now()->format('Y-m-d'),
                'clock_in_hour' => $submit_hour->format('H:i:s'),
                'clock_out_hour' => '00:00:00', 
                'status' => $status,
                'minutes_of_late' => $status == 'late' ? (int) $minutes_of_late : 0,
            ]);
            return $attendance;
        }
    }

    public function eventAttendanceHistory($search, $date, $event_id){
        $query=EventAttendance::query();
       
        if ($date) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                abort(400, 'Format tanggal harus YYYY-MM');
            }
        
            $query->whereRaw("DATE_FORMAT(submit_date, '%Y-%m-%d') = ?", [$date]);
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
            abort(404, 'Absensi tidak ditemukan');
        }
        if(!Carbon::parse($attendance->submit_date)->isToday()){
            abort(403, 'Anda tidak diizinkan untuk mengedit absensi ini');
        } 
        $attendance->update([
            'status' => $data->getStatus(),
        ]);
        return [
            'message' => 'Absensi berhasil diupdate',
            'attendance' => $attendance,
        ];
    }
}