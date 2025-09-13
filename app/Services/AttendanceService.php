<?php

namespace App\Services;


use App\DTOs\EditEventAttendanceData;
use App\DTOs\EditShiftingAttendanceData;
use App\DTOs\EditSubjectAttendanceData;
use App\DTOs\EventAttendanceData;
use App\DTOs\ShiftingAttendanceData;
use App\DTOs\SubjectAttendanceData;
use App\Exceptions\SilentHttpException;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\ClassShiftingSchedule;
use App\Models\ClassShiftingSchedulePic;
use App\Models\ClassSubjectSchedule;
use App\Models\CustomDayOff;
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
use DB;
use Illuminate\Console\Scheduling\Schedule;
use Log;


class AttendanceService
{

    public function __construct(protected FirebaseService $firebase){}

    public function todayAttendance(){
        $today = Carbon::now()->format('Y-m-d');
        $dayOff=CustomDayOff::where('date', Carbon::parse($today)->format('Y-m-d'))->first();
        if ($dayOff) {
            throw new SilentHttpException(400, 'Hari ini adalah hari libur');
        }
        $attendances = ShiftingAttendance::where('submit_date', $today)->whereIn('status', ['present', 'late', 'present_in_tolerance'])
            ->with('student', 'classroom')
            ->get();
        if ($attendances->isEmpty()) {
            throw new SilentHttpException(404, 'Data Kosong');
        }
        
        return[
            'date' => $today,
            'number_of_in' => $attendances->count(),
            'number_of_out' => $attendances->whereNotNull('clock_out_hour')->count(),
        ];
    }
    public function shiftingAttendanceHistory($date, $class_id, $type = 'in', $search)
    {
        $dayOff=CustomDayOff::where('date', Carbon::now()->format('Y-m-d'))->where('date', Carbon::parse($date)->format('Y-m-d'))->first();
        if ($dayOff) {
            throw new SilentHttpException(400, 'Hari ini adalah hari libur');
        }
        $query=ShiftingAttendance::query();
        if ($date) {
            $parsedDate = Carbon::parse($date)->format('Y-m-d');
            $query->where('submit_date', $parsedDate);
        }
        if ($class_id) {
            $query->where('class_id', $class_id)->whereHas('student') 
            ->whereHas('student')
            ->orderByRaw("FIELD(status, 'present', 'present_in_tolerance', 'alpha') ASC")
            ->orderBy(
                Student::select('full_name')
                ->whereColumn('students.id', 'shifting_attendances.student_id'),'asc'
            );
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
        $attendances = $query->latest('submit_date')->with('classroom', 'student')->paginate(10);
        
        if ($attendances->isEmpty()) {
            throw new SilentHttpException(404, "Data Kosong");
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
            'number_of_attendances' => $query->whereIn('status', ['present', 'late', 'present_in_tolerance'])->where('submit_date', Carbon::now()->format('Y-m-d'))->count() ,
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
            'attendances' => $attendancesWithClassroom,
        ];
    }
    

    public function shiftingAttendance(ShiftingAttendanceData $data){
        $academic_year=AcademicYear::where('status', 'active')->first()->value('attendance_mode');
        $student=Student::where('uuid', $data->getStudent())->first();
        if (!$student) {
            throw new SilentHttpException(404, 'Murid tidak ditemukan');
        }
        $parent=$student->parent;
        $day=ClassShiftingSchedule::where('class_id', $student->class_id)->where('day', Carbon::now()->dayOfWeek())->first();
        if(!$day){
            throw new SilentHttpException(404, 'Jadwal kelas tidak ditemukan untuk hari ini.');
        }
        $attendance=ShiftingAttendance::where('student_id', $student->id)->where('submit_date', Carbon::now()->format('Y-m-d'))->where('class_id', $day->class_id)->first();
        if (!$attendance) {
            throw new SilentHttpException(404, 'Absensi tidak ditemukan');
        }
        $pics=ClassShiftingSchedulePic::where('class_shifting_schedule_id', $day->id)->get();
        if ($pics->isEmpty()) {
            throw new SilentHttpException(404, 'PIC tidak ditemukan');
        }
        
        if($academic_year!='per-shift'){
            throw new SilentHttpException(400, 'Absensi tidak aktif');
        }

        $late_tolerance = (int) Setting::where('key', 'late_tolerance')->value('value');
        $start_hour = Carbon::parse($attendance->shifting_start_hour);
        $deadline = $start_hour->copy()->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        $minutes_of_late = $start_hour->diffInMinutes($data->getSubmitHour());
        $isPic = $pics->contains('teacher_id', auth()->user()->id);
        $type= $data->getType();
        if (!$isPic) {
            throw new SilentHttpException(403, 'Anda tidak ditugaskan untuk jadwal kelas ini.');
        }
        if ($attendance->clock_out_hour && $attendance->clock_in_hour) {
            return throw new SilentHttpException(400, 'Siswa telah melakukan absensi');
        }
        

        
        if ($submit_hour <= $start_hour && !$attendance->clock_in_hour && $type=='in') {
            $attendance->update([
                'status' => 'present',
                'clock_in_hour' => $submit_hour
            ]);
            
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                    $body=  $student->full_name . ' telah melakukan absensi masuk, dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_masuk',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }

            return [
                'message' => 'Berhasil Absensi Masuk',
            ];
        }else if ($submit_hour <= $deadline && !$attendance->clock_in_hour && $type=='in') {
             $attendance->update([
                'status' => 'present_in_tolerance',
                'clock_in_hour' => $submit_hour,
                'minutes_of_late' => (int) $minutes_of_late
            ]);
            
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                    $body= $student->full_name . ' telah melakukan absensi masuk, dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_masuk',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }
            return [
                'message' => 'Berhasil Absensi Masuk',
            ];
        }else if ($submit_hour > $deadline && !$attendance->clock_in_hour && $type=='in') {
            $attendance->update([
                'status' => 'late',
                'minutes_of_late' => (int) $minutes_of_late,
                'clock_in_hour' => $submit_hour,
            ]);
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                    $body= $student->full_name . ' telah melakukan absensi masuk, dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_masuk',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }
            return [
                'message' => 'Berhasil Absensi Masuk',
            ];
            
        }else if (!$attendance->clock_out_hour && $attendance->clock_in_hour && $type=='out') {
            $attendance->update([
                'clock_out_hour' => $submit_hour,
            ]);
        
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                    $body= $student->full_name . ' telah melakukan absensi keluar, dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_keluar',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }
            return [
                'message' => 'Berhasil Absensi Keluar',
            ];
        }else if ($attendance->clock_in_hour && !$attendance->clock_out_hour && $type=='in') {
            throw new SilentHttpException(400, 'Siswa telah melakukan absensi masuk');
        }else{
            throw new SilentHttpException(400, 'Anda harus melakukan absensi masuk terlebih dahulu');
        }

    }
 
    public function editShiftingAttendance(EditShiftingAttendanceData $data, $attendance_id){
        $attendance=ShiftingAttendance::where('id', $attendance_id)->where('submit_date', Carbon::now()->format('Y-m-d'))->first();
        if (!$attendance) {
            throw new SilentHttpException(404, 'Absensi tidak ditemukan');
        }
        $submit_date=Carbon::parse($attendance->submit_date)->format('Y-m-d');
        if($submit_date != Carbon::now()->format('Y-m-d')){
            throw new SilentHttpException(403, 'Anda tidak diizinkan untuk mengedit absensi ini, karena tanggal absensi sudah terlewat. Silahkan hubungi admin untuk mengedit absensi');
        }
        $classSchedule=ClassShiftingSchedule::where('day', Carbon::now()->dayOfWeek())->first();
        if (!$classSchedule) {
            throw new SilentHttpException(404, 'Jadwal kelas tidak ditemukan');
        }
        $pic = ClassShiftingSchedulePic::where('class_shifting_schedule_id', $classSchedule->id)->first('teacher_id');
        if (!$pic) {
            throw new SilentHttpException(404, 'PIC tidak ditemukan');
        }
        if ($pic->teacher_id != auth()->user()->id) {
            throw new SilentHttpException(403, 'Anda tidak diizinkan untuk mengedit absensi ini');
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
        // $query=SubjectAttendance::query();
        // if ($date) {
        //     $parsedDate = Carbon::parse($date)->format('Y-m-d');
        //     $query->where('submit_date', $parsedDate);
        // }
        // if ($class_id) {
        //     $query->where('class_id', $class_id);
        // }
        // if ($subject) {
        //     $query->where('subject_name', $subject);
        // }
        
        // $attendances = $query->latest('submit_date')->with('classroom', 'student')->paginate(10);
        
        // if ($attendances->isEmpty()) {
        //     throw new SilentHttpException(404, "Data Kosong");
        // }

        // $attendancesWithRelations=[];
        // foreach ($attendances->items() as $attendance) {
        //     $attendancesWithRelations[]=[
        //         'id' => $attendance->id,
        //         'student' => optional($attendance->student)->full_name,
        //         'classroom' => optional($attendance->classroom)->name,
        //         'academic_year'=> optional($attendance->academicYear)->title,
        //         'subject_name' => $attendance->subject_name,
        //         'subject_start_hour' => $attendance->subject_start_hour,
        //         'subject_end_hour' => $attendance->subject_end_hour,
        //         'submit_date' => $attendance->submit_date,
        //         'submit_hour'=> $attendance->submit_hour,
        //         'status' => $attendance->status,
        //         'note'=>$attendance->note,
        //     ];
        // }
        // return [
        //     'number_of_attendances' => $attendances->total(),
        //     'current_page' => $attendances->currentPage(),
        //     'last_page' => $attendances->lastPage(),
        //     'per_page' => $attendances->perPage(),
        //     'attendances' => $attendancesWithRelations,
        // ];
        $query = DB::table('subject_attendances')
    ->leftJoin('students', 'students.id', '=', 'subject_attendances.student_id')
    ->leftJoin('classrooms', 'classrooms.id', '=', 'subject_attendances.class_id')
    ->leftJoin('academic_years', 'academic_years.id', '=', 'subject_attendances.academic_year_id')
    ->select(
        'subject_attendances.id',
        'students.full_name as student',
        'classrooms.name as classroom',
        'academic_years.title as academic_year',
        'subject_attendances.subject_name',
        'subject_attendances.subject_start_hour',
        'subject_attendances.subject_end_hour',
        'subject_attendances.submit_date',
        'subject_attendances.submit_hour',
        'subject_attendances.status',
        'subject_attendances.note'
    );


if ($date) {
    $parsedDate = Carbon::parse($date)->format('Y-m-d');
    $query->whereDate('subject_attendances.submit_date', $parsedDate);
}
if ($class_id) {
    $query->where('subject_attendances.class_id', $class_id);
}
if ($subject) {
    $query->where('subject_attendances.subject_name', $subject);
}

$attendances = $query->orderByDesc('subject_attendances.submit_date')->paginate(10);

if ($attendances->isEmpty()) {
    throw new SilentHttpException(404, "Data Kosong");
}

return [
    'number_of_attendances' => $attendances->total(),
    'current_page' => $attendances->currentPage(),
    'last_page' => $attendances->lastPage(),
    'per_page' => $attendances->perPage(),
    'attendances' => $attendances->items(),
];
    }

    public function getClassroomByTeacher($search){
        $query= ClassSubjectSchedule::where('teacher_id', auth()->user()->id)->where('day', Carbon::now()->dayOfWeek())->with('classroom');

        if ($search) {
            $query->where('name', 'like', "%$search%");
        }
        $classrooms = $query->get();
        if ($classrooms->isEmpty()) {
            throw new SilentHttpException(404, 'Kelas tidak ditemukan');
        }
        $classroomsWithRelations = [];
        foreach ($classrooms as $classroom) {
            $classroomsWithRelations[] = [
                'id' => $classroom->id,
                'classroom' => $classroom->classroom->name,
            ];
        }
        return $classroomsWithRelations;

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
            throw new SilentHttpException(404, 'Jadwal tidak ditemukan');
        }
        $subjectNames = $schedules->pluck('subject.name')->unique()->values();

        return $subjectNames;
    }
    public function getSubjectAttendance($class_id, $subject)
    {
        $subject = Subject::where('name', $subject)->first();
        if (!$subject) {
            throw new SilentHttpException(404, 'Mata pelajaran tidak ditemukan');
        }

        $classSchedule = ClassSubjectSchedule::where('class_id', $class_id)
            ->where('subject_id', $subject->id)
            ->where('teacher_id', auth()->user()->id)
            ->first();

        if (!$classSchedule) {
            throw new SilentHttpException(404, 'Jadwal pelajaran tidak ditemukan untuk kelas ini');
        }

        $students = Student::where('class_id', $classSchedule->class_id)
            ->with('classroom', 'parent')
            ->get();

        if ($students->isEmpty()) {
            throw new SilentHttpException(404, 'Tidak ada murid di kelas ini');
        }

        $today = Carbon::now()->format('Y-m-d');
        $attendanceWithRelations = [];
        foreach ($students as $student) {
            $attendance = SubjectAttendance::where('student_id', $student->id)
                ->where('class_id', $classSchedule->class_id)
                ->where('subject_name', $subject->name)
                ->where('submit_date', $today)
                ->first();

            $status = $attendance ? $attendance->status : 'alpha';

            $attendanceWithRelations[] = [
                'id' => $student->id,
                'student_name' => $student->full_name,
                'classroom' => optional($student->classroom)->name,
                'uuid' => $student->uuid,
                'status' => $status,
            ];
        }

        return $attendanceWithRelations;
    }
    public function subjectAttendance(SubjectAttendanceData $data){
        $academic_year=AcademicYear::where('status', 'active')->first()->value('attendance_mode'); 
        $subject = Subject::where('name', $data->getSubjectName())->firstOrFail();
        
        $allStudents = Student::where('class_id', $data->getClassId())->get();

        $schedule = ClassSubjectSchedule::where('class_id', $data->getClassId())
            ->where('subject_id', $subject->id)
            ->first();


        if (!$schedule) {
            throw new SilentHttpException(404, 'Jadwal pelajaran tidak ditemukan');
        }
        if($schedule->teacher_id != auth()->user()->id){
            throw new SilentHttpException(403, 'Anda tidak diizinkan untuk mengabsen mata pelajaran ini');
        }
        if ($academic_year != 'per-subject') {
            throw new SilentHttpException(400, 'Absensi tidak aktif');
        }
        $presentIds = $data->getStudentIdList();
        $today = Carbon::now()->format('Y-m-d');
        $results = []; 
        $parents = [];
        foreach ($allStudents as $student) {
            $attendance = SubjectAttendance::where('student_id', $student->id)
                ->where('submit_date', $today)
                ->where('subject_name', $subject->name)
                ->first();
            $parent = $student->parent;
            $isPresent = in_array($student->id, $presentIds);

            if ($attendance) {
                if ($attendance->status === 'alpha' && !$isPresent) {
        
                    $results[] = $student->full_name . ' tetap alpha';
                } elseif ($attendance->status === 'alpha' && $isPresent) {
                    $attendance->update([
                    'status' => 'present',
                    'submit_hour' => $data->getSubmitHour()
                    ]);
                    $results[] = $student->full_name . ' berhasil absen (status diupdate)';
                } else {
                    $results[] = $student->full_name . ' sudah absen';
                }
                continue;
            }

            $status = $isPresent ? 'present' : 'alpha';

            try {
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
                $results[] = $student->full_name." ".$status;
            } catch (\Exception $e) {
                $results[] = $student->full_name. ' gagal absen';
            }

            
             try {
                if ($isPresent && $parent && $parent->notification_key) {
                $title = 'Absensi Siswa';
                $body  = $student->full_name.' '.$status.' pada mata pelajaran '.$subject->name;

                $this->firebase->sendToDevice($parent->notification_key, $title, $body, [
                    'tipe' => 'absensi_pelajaran',
                ]);

            }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }
        }

        
        
        return [
            'message' => 'Proses absensi selesai',
            'results' => $results
        ];
    }

    public function editSubjectAttendance(EditSubjectAttendanceData $data, $id){
        $attendance=SubjectAttendance::where('id', $id)->where('submit_date', Carbon::now()->format('Y-m-d'))->with('classroom')->first();
        if (!$attendance) {
            throw new SilentHttpException(404, 'Absensi tidak ditemukan');
        }
        $submit_date=Carbon::parse($attendance->submit_date)->format('Y-m-d');
        if($submit_date != Carbon::now()->format('Y-m-d')){
            throw new SilentHttpException(403, 'Anda tidak diizinkan untuk mengedit absensi ini, karena tanggal absensi sudah terlewat. Silahkan hubungi admin untuk mengedit absensi');
        }
        
        $teacher=ClassSubjectSchedule::where('class_id', $attendance->class_id)
            ->whereHas('subject', function($query) use ($attendance) {
                $query->where('name', $attendance->subject_name);
            })
            ->where('day', Carbon::now()->dayOfWeek())
            ->first();
        if (!$teacher) {
            throw new SilentHttpException(404, 'Jadwal pelajaran tidak ditemukan');
        }
        if($teacher->teacher_id != auth()->user()->id){
            throw new SilentHttpException(403, 'Anda tidak diizinkan untuk mengedit absensi ini');
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
            $query->whereYear('start_date', $parsedDate->year)
              ->whereMonth('start_date', $parsedDate->month);
        }
        $events = $query->paginate(10);
        if ($events->isEmpty()) {
            throw new SilentHttpException(404, 'Kegiatan tidak ditemukan');
        }
        $eventsWithRelations = [];
        foreach ($events as $event) {
            $eventsWithRelations[] = [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
                'start_time' => $event->start_hour,
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
            throw new SilentHttpException(404, 'Siswa tidak ditemukan');
        }
        $parent=$student->parent;
    

        $pics=EventPic::where('event_id', $data->getEvent())->get();
        if ($pics->isEmpty()) {
            throw new SilentHttpException(404, 'PIC tidak ditemukan');
        } 
        $attendance=EventAttendance::where('student_id', $student->id)
            ->where('event_id', $data->getEvent())
            ->where('submit_date', Carbon::now()->format('Y-m-d'))->with('event')
            ->first();
        $late_tolerance = (int)Setting::where('key', 'late_tolerance')->value        ('value');
        $start_hour=Carbon::parse($attendance->event->start_hour);
        $deadline = Carbon::parse($attendance->event->start_hour)->addMinutes($late_tolerance);
        $submit_hour = Carbon::parse($data->getSubmitHour());
        $minutes_of_late = $start_hour->diffInMinutes($submit_hour);
        $isPic = $pics->contains('pic_id', auth()->user()->id);
        if (!$isPic) {
            throw new SilentHttpException(403, 'Anda tidak ditugaskan untuk kegiatan ini.');
        }

        if ($attendance->clock_out_hour && $attendance->clock_in_hour) {
            return throw new SilentHttpException(400, 'Siswa telah melakukan absensi');
        }
        

        
        if ($submit_hour <= $start_hour && !$attendance->clock_in_hour ) {
            $attendance->update([
                'status' => 'present',
                'clock_in_hour' => $submit_hour
            ]);
            
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                    $body= $student->full_name . ' telah melakukan absensi masuk pada kegitan, ' . $attendance->event->name . ' dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_kegiatan',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }

            return [
                'message' => 'Berhasil Absensi Masuk',
            ];
        }else if ($submit_hour <= $deadline && !$attendance->clock_in_hour ) {
             $attendance->update([
                'status' => 'present_in_tolerance',
                'clock_in_hour' => $submit_hour,
                'minutes_of_late' => (int) $minutes_of_late
            ]);
            
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                   $body= $student->full_name . ' telah melakukan absensi masuk pada kegitan, ' . $attendance->event->name . ' dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_kegiatan',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }
            return [
                'message' => 'Berhasil Absensi Masuk',
            ];
        }else if ($submit_hour > $deadline && !$attendance->clock_in_hour ) {
            $attendance->update([
                'status' => 'late',
                'minutes_of_late' => (int) $minutes_of_late,
                'clock_in_hour' => $submit_hour,
            ]);
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                    $body= $student->full_name . ' telah melakukan absensi masuk pada kegitan, ' . $attendance->event->name . ' dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_kegiatan',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }
            return [
                'message' => 'Berhasil Absensi Masuk',
            ];
            
        }else if (!$attendance->clock_out_hour && $attendance->clock_in_hour ) {
            if ($submit_hour < Carbon::parse($attendance->clock_in_hour)->addMinutes(2)) {
                throw new SilentHttpException(400, 'Anda harus menunggu 2 menit untuk melakukan absensi keluar');
            }
            $attendance->update([
                'clock_out_hour' => $submit_hour,
            ]);
        
             try {
                if ($parent && $parent->notification_key) {
                    $title= 'Absensi '.$student->full_name;
                    $body= $student->full_name . ' telah melakukan absensi keluar pada kegitan, ' . $attendance->event->name . ' dengan status ' .  $attendance->status;

                    $this->firebase->sendToDevice($parent->notification_key, $title, $body,     [
                        'tipe' => 'absensi_kegiatan',
                    ]);
                }
            } catch (\Throwable $th) {
                Log::error('Gagal kirim notifikasi Firebase', [
                    'token' => $parent ? $parent->notification_key : null,
                    'error_message' => $th->getMessage(),
                ]);
            }
            return [
                'message' => 'Berhasil Absensi Keluar',
            ];
        }else{
            throw new SilentHttpException(400, 'Anda harus melakukan absensi masuk terlebih dahulu');
        }
       
        
    }

    public function eventAttendanceHistory($search, $date, $event_id){
        $query=EventAttendance::query();
       
        if ($date) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                throw new SilentHttpException(400, 'Format tanggal harus YYYY-MM');
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
        $attendances = $query->latest('submit_date')->with('event', 'student.classroom', 'academicYear')->paginate(10);
        
        if ($attendances->isEmpty()) {
            throw new SilentHttpException(404, "Data Kosong");
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
            throw new SilentHttpException(404, 'Absensi tidak ditemukan');
        }
        $submit_date=Carbon::parse($attendance->submit_date)->format('Y-m-d');
        if($submit_date != Carbon::now()->format('Y-m-d')){
            throw new SilentHttpException(403, 'Anda tidak diizinkan untuk mengedit absensi ini, karena tanggal absensi sudah terlewat. Silahkan hubungi admin untuk mengedit absensi');
        }
        $pic=EventPic::where('event_id', $attendance->event_id)
            ->where('pic_id', auth()->user()->id)
            ->first();
        if (!$pic) {
            throw new SilentHttpException(403, 'Anda tidak diizinkan untuk mengedit absensi ini');
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