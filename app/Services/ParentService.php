<?php

namespace App\Services;

use App\DTOs\ChangePasswordData;
use App\Exceptions\SilentHttpException;
use App\Models\Announcement;
use App\Models\ClassSubjectSchedule;
use App\Models\CustomDayOff;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventParticipant;
use App\Models\PaymentAssignment;
use App\Models\Setting;
use App\Models\ShiftingAttendance;
use App\Models\Student;
use App\Models\SubjectAttendance;
use Carbon\Carbon;
use DB;

class ParentService
{
    public function changePassword(ChangePasswordData $data ){
        $user=auth()->user();

        if (!$user){
            return throw new SilentHttpException(404, 'Pengguna tidak ditemukan');
        }else if (!password_verify($data->getOldPassword(), $user->password)) {
            return throw new SilentHttpException(400, 'Password lama salah');
        }

        $user->password = bcrypt($data->getNewPassword());
        $user->save();
        return [
            'message' => 'Password berhasil diperbarui',
        ];

    }

    public function setNotificationKey($notification_key){
        $user = auth()->user();
        if (!$user) {
            return throw new SilentHttpException(404, 'Pengguna tidak ditemukan');
        }

        $user->notification_key = $notification_key;
        $user->save();

        return [
            'message' => 'Notification key berhasil disimpan',
        ];
    }

    public function todayAttendance($student){
        $today = Carbon::now()->format('Y-m-d');
        $dayOff=CustomDayOff::where('date', Carbon::parse($today)->format('Y-m-d'))->first();
        if ($dayOff) {
            throw new SilentHttpException(400, 'Hari ini adalah hari libur');
        }
        $attendance = ShiftingAttendance::where('student_id', $student->id)
        ->where('submit_date', Carbon::now('Asia/Jakarta')->format('Y-m-d'))
        ->first();
        if (!$attendance){
            return [throw new SilentHttpException(404,'Absensi tidak ditemukan')];
        }

        $days = [
            'Sunday' => 'Minggu',
            'Monday' => 'Senin',
            'Tuesday' => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis',
            'Friday' => 'Jumat',
            'Saturday' => 'Sabtu', 
        ];
        $months = [
            'January' => 'Januari',
            'February' => 'Februari',
            'March' => 'Maret',
            'April' => 'April',
            'May' => 'Mei',
            'June' => 'Juni',
            'July' => 'Juli',
            'August' => 'Agustus',
            'September' => 'September',
            'October' => 'Oktober',
            'November' => 'November',
            'December' => 'Desember',
        ];
        $carbon = Carbon::now()->timezone('Asia/Jakarta');
        $hari = $days[$carbon->format('l')];
        $bulan= $months[$carbon->format('F')];
    
       return [
        'date'=>$hari . ', ' . $carbon->format('d').' '.$bulan.' '.$carbon->format('Y'),
        'attendance'=>$attendance
       ] ;
            
       
    }

    public function attendanceHistory($date, $student){

        
        $query = ShiftingAttendance::query();
        $query->where('student_id', $student->id);
        
        if ($date) {
            $date = Carbon::parse($date) ;
            $query->whereYear('submit_date', $date->year)->whereMonth('submit_date', $date->month);
        }
        $allAttendance = $query->get();
        $presentCount = $allAttendance->where('status', 'present')->count();
        $absentCount = $allAttendance->where('status', 'alpha')->count();
        $lateCount = $allAttendance->where('status', 'late')->count();
        $attendance = $query->latest('submit_date')->paginate(10);

        if ($attendance->isEmpty()) {
            return [
                throw new SilentHttpException(404,'Data Tidak Ditemukan'),
            ];
        }
        $days = [
            'Sunday' => 'Minggu',
            'Monday' => 'Senin',
            'Tuesday' => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis',
            'Friday' => 'Jumat',
            'Saturday' => 'Sabtu', 
        ];
    
        $attendancesWithDay = [];
        foreach ($attendance->items() as $item) {
            $itemArray = $item->toArray();
            $carbonDate = Carbon::parse($item->submit_date);
            $itemArray['day'] = $days[$carbonDate->format('l')];
            $attendancesWithDay[] = $itemArray;
        }
        return[
            'number_of_attendances' => $attendance->total(),
            'current_page' => $attendance->currentPage(),
            'last_page' => $attendance->lastPage(),
            'per_page' => $attendance->perPage(),
            'present' => $presentCount,
            'absent' => $absentCount,
            'late' => $lateCount,
            'attendances' => $attendancesWithDay,
        ];
    }

    public function subjectAttendanceHistory($date, $student){
        $query = SubjectAttendance::query();
        $query->where('student_id', $student->id);
        if ($date) {
            $parsedDate = Carbon::parse($date)->format('Y-m-d');
            $query->where('submit_date', $parsedDate);
        }
        $attendances = $query->latest('submit_date')->with('classroom', 'student')->paginate(10);
        if ($attendances->isEmpty()) {
            return [
                throw new SilentHttpException(404,'Data Tidak Ditemukan'),
            ];
        }

        $attendancesWithRelations = [];
        foreach ($attendances->items() as $item) {
            $attendancesWithRelations[] = [
                'id' => $item->id,
                'student' => optional($item->student)->full_name,
                'classroom' => optional($item->classroom)->name,
                'academic_year'=> optional($item->academicYear)->title,
                'subject_name' => $item->subject_name,
                'subject_start_hour' => $item->subject_start_hour,
                'subject_end_hour' => $item->subject_end_hour,
                'submit_date' => $item->submit_date,
                'submit_hour'=> $item->submit_hour,
                'status' => $item->status,
                'note'=>$item->note,
            ];
        };
        return[
            'number_of_attendances' => $attendances->total(),
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
            'attendances' => $attendancesWithRelations,
        ];
    }

    public function getAnnouncements($id, $search){
        if ($id) {
            $announcement = Announcement::where('id', $id)->first();
            if (!$announcement) {
                return throw new SilentHttpException(404,'Pengumuman tidak ditemukan');
            }
            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => $announcement->content,
                'short_content' => $announcement->short_content,
                'attachments' => $announcement->attachments->pluck('url'),
                'created_at' => $announcement->created_at,
                'updated_at' => $announcement->updated_at
            ];
        }else {
            $query = Announcement::query();
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%$search%")
                      ->orWhere('content', 'like', "%$search%");
                });
            }

            $announcements = $query->latest()->with('attachments')->paginate(10);

            $announcementWithRelations = [];
            foreach ($announcements as $announcement) {
                $announcementWithRelations[] = [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'content' => $announcement->content,
                    'short_content' => $announcement->short_content,
                    'attachments' => $announcement->attachments->pluck('url'),
                    'created_at' => $announcement->created_at,
                    'updated_at' => $announcement->updated_at
                ];
            }
            return [
                'current_page' => $announcements->currentPage(),
                'last_page' => $announcements->lastPage(),
                'per_page' => $announcements->perPage(),
                'announcements' => $announcementWithRelations
            ];
        }

    }

    public function getSubjectSchedule($student){
        $schedules=ClassSubjectSchedule::where('class_id', $student->class_id)->whereHas('classroom', function ($q) use ($student) { $q->where('id', $student->class_id); })->get();
        if ($schedules->isEmpty()) {
            throw new SilentHttpException(404, 'Jadwal tidak ditemukan');
        }
        
        $scheduleWithRelations = [];
        foreach ($schedules as $schedule) {
            $subjectName = DB::table('subjects')->where('id', $schedule->subject_id)->value('name');
            
            $scheduleWithRelations[] = [
                'id' => $schedule->id,
                'subject' => $subjectName,
                'classroom' => $schedule->classroom->name,
                'academic_year'=> optional($schedule->academicYear)->title,
                'day' => $schedule->day,
                'start_hour' => $schedule->start_hour,
                'end_hour' => $schedule->end_hour,
                'teacher' => optional($schedule->teacher)->full_name,
            ];
        };

        return $scheduleWithRelations;
    }


    public function getEventDate($student,$date){
        $parsedDate = Carbon::parse($date);
        $events = Event::whereHas('participants', function($q) use ($student) {
            $q->where('student_id', $student->id);
        })
        ->whereYear('start_date', $parsedDate->year)
        ->whereMonth('start_date', $parsedDate->month)
        ->select( 'start_date', 'end_date', ) 
        ->get();
        // $events = Event::whereYear('start_date', $parsedDate->year)->whereMonth('start_date', $parsedDate->month)->get(['start_date', 'end_date']);
        if ($events->isEmpty()) {
            throw new SilentHttpException(404, 'Kegiatan tidak ditemukan');
        }
        return $events;
    }

    public function getEventSchedule($student, $date){
        $query = EventParticipant::query();
        $query->where('student_id', $student->id);
        if ($date) {
            $parsedDate = Carbon::parse($date);
            $query->whereHas('event', function($q) use ($parsedDate) {
                $q->whereYear('start_date', $parsedDate->year)
                  ->whereMonth('start_date', $parsedDate->month);
            });
        }
        $schedules = $query->with('event')->paginate(10);
        if ($schedules->isEmpty()) {
            throw new SilentHttpException(404, 'Kegiatan tidak ditemukan');
        }
        
      $schedulesWithRelations = [];
        foreach ($schedules as $schedule) {
            $schedulesWithRelations[] = [
                'id' => $schedule->event->id,
                'name' => $schedule->event->name,
                'description' => $schedule->event->description,
                'start_date' => $schedule->event->start_date,
                'end_date' => $schedule->event->end_date,
                'start_time' => $schedule->event->Start_hour,
                'end_time' => $schedule->event->end_hour,
            ];
        }
        
        return  [
            'number_of_schedules' => $schedules->total(),
            'current_page' => $schedules->currentPage(),
            'last_page' => $schedules->lastPage(),
            'per_page' => $schedules->perPage(),
            'attendances' => $schedulesWithRelations,
        ];
        
    }

    public function eventAttendanceHistory ($date, $student){
        $query = EventAttendance::query();
        $query->where('student_id', $student->id);

        if ($date) {
            $parsedDate = Carbon::parse($date)->format('Y-m-d');
            $query->whereDate('submit_date', $parsedDate);
        }
        $attendances = $query->latest('submit_date')->with('student', 'event', 'academicYear')->paginate(10);
        if ($attendances->isEmpty()) {
            return [
                throw new SilentHttpException(404,'Data Tidak Ditemukan'),
            ];
        }

        $attendancesWithRelations= $attendances->map(function ($attendance) {
            return [
                'id' => $attendance->id,
                'student' => optional($attendance->student)->full_name,
                'classroom' => optional($attendance->student->classroom)->name,
                'event' => optional($attendance->event)->name,
                'academic_year' => optional($attendance->academicYear)->title,
                'submit_date' => $attendance->submit_date,
                'clockInHour'=> $attendance->clock_in_hour,
                'clockOutHour'=> $attendance->clock_out_hour,
                'status' => $attendance->status,
                'note' => $attendance->note,
            ];
        })->toArray();
        return [
            'number_of_attendances' => $attendances->total(),
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
            'attendances' => $attendancesWithRelations, 
        ];

    }

    public function studentIdCard($student){
        $student = Student::find($student->id);
        if (!$student) {
            return throw new SilentHttpException(404, 'Siswa tidak ditemukan');
        }
        
        $school = Setting::where('key', 'school_name')->value('value');
        $schoolAddress = Setting::where('key', 'school_address')->value('value');
        $schoolLogo = Setting::where('key', 'school_logo')->value('value');

        return[
            'school_name' => $school,
            'school_address' => $schoolAddress,
            'school_logo' => $schoolLogo,
            'student' => $student,
        ];
    }

    public function getPayment($year, $student){
        $query = PaymentAssignment::query();
        $query->where('student_id', $student->id);
        if ($year) {
            $year = (int)$year; 
            $query->whereHas('payment', function($q) use ($year) {
                $q->whereYear('due_date', $year);
            });
        }
        $payment = $query->with('payment')->paginate(10);
        if ($payment->isEmpty()) {
            return throw new SilentHttpException(404, 'Pembayaran tidak ditemukan');
        }
        
        $paymentWithRelations = [];
        foreach ($payment as $item) {
            $paymentWithRelations[] = [
                'id' => $item->payment->id,
                'academic_year' => optional($item->payment->academicYear)->title,
                'title' => $item->payment->title,
                'description' => $item->payment->description,
                'nominal' => $item->payment->nominal,
                'due_date' => $item->payment->due_date,
                'payment_date' => $item->payment_date,
            ];
        }
        return [
            'current_page' => $payment->currentPage(),
            'last_page' => $payment->lastPage(),
            'per_page' => $payment->perPage(),
            'payments' => $paymentWithRelations
        ];
    }

    public function getUnpaidPayment($student){
        $query = PaymentAssignment::query();
        $query->where('student_id', $student->id);
        $query->whereNull('payment_date');
        $payment = $query->get();
        if ($payment->isEmpty()) {
            return throw new SilentHttpException(404, 'Pembayaran tidak ditemukan');
        }
        return [
            'unpaid_payments' => $payment->count(),
        ];
    }

    public function getPaymentYear($student){
        $payments = PaymentAssignment::where('student_id', $student->id)
        ->whereHas('payment') 
        ->with('payment:id,due_date') 
        ->get()
        ->pluck('payment.due_date') 
        ->map(fn($date) => Carbon::parse($date)->format('Y'))
        ->unique()
        ->values();

        if ($payments->isEmpty()) {
            throw new SilentHttpException(404, 'Pembayaran tidak ditemukan');
        }

        return [
            'payment_years' => $payments,
        ];
    }
}