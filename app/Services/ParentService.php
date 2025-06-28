<?php

namespace App\Services;

use App\DTOs\ChangePasswordData;
use App\Models\ShiftingAttendance;
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

        $attendance = ShiftingAttendance::where('student_id', $student->id)->where('submit_date', Carbon::now()->timezone('Asia/Jakarta')->format('Y-m-d'))->first();
        
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
        $attendance
       ] ;
            
       
    }

    public function attendanceHistory($date, $student){

        $date = Carbon::parse($date)->format('Y-m-d');
        $query = ShiftingAttendance::query();
        $query->where('student_id', $student->id);

        if ($date) {
            $query->where('submit_date', $date);
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
}