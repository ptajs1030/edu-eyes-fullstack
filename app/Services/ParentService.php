<?php

namespace App\Services;

use App\DTOs\ChangePasswordData;
use App\Models\Announcement;
use App\Models\ShiftingAttendance;
use App\Models\SubjectAttendance;
use Carbon\Carbon;

class ParentService
{
    public function changePassword(ChangePasswordData $data ){
        $user=auth()->user();

        if (!$user){
            return abort(404, 'User not found');
        }else if (!password_verify($data->getOldPassword(), $user->password)) {
            return abort(400, 'Old Password is Incorrect');
        }

        $user->password = bcrypt($data->getNewPassword());
        $user->save();
        return [
            'message' => 'Password changed successfully',
        ];

    }

    public function todayAttendance($student){
        $attendance = ShiftingAttendance::where('student_id', $student->id)
        ->where('submit_date', Carbon::now('Asia/Jakarta')->format('Y-m-d'))
        ->first();
        if (!$attendance){
            return [abort(404,'Attendance not found')];
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
        $carbon = Carbon::now()->timezone('Asia/Jakarta');
        $hari = $days[$carbon->format('l')];
    
       return [
        'date'=>$hari . ', ' . $carbon->format('d-m-Y'),
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
        
        $attendance = $query->paginate(10);

        if ($attendance->isEmpty()) {
            return [
                abort(404,'Data Tidak Ditemukan'),
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
        $attendances = $query->with('classroom', 'student')->paginate(10);
        if ($attendances->isEmpty()) {
            return [
                abort(404,'Data Tidak Ditemukan'),
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
                return abort(404,'Announcement not found');
            }
            return $announcement;
        }else {
            $query = Announcement::query();
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%$search%")
                      ->orWhere('content', 'like', "%$search%");
                });
            }

            $announcement = $query->paginate(10);
            return $announcement;
        }

    }
}