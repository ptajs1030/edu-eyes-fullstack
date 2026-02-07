<?php

namespace App\Services;

use App\DTOs\ChangePasswordData;
use App\Exceptions\SilentHttpException;
use App\Models\AcademicYear;
use App\Models\Event;
use Carbon\Carbon;

class TeacherService
{
    public function changePassword(ChangePasswordData $data ){
        $user=auth()->user();

        if (!$user){
            throw new SilentHttpException(404, 'Pengguna tidak ditemukan');
        }
        if (!password_verify($data->getOldPassword(), $user->password)) {
            throw new SilentHttpException(400, 'Password lama salah');
        }

        $user->password = bcrypt($data->getNewPassword());
        $user->save();
        return [
            'message' => 'Password berhasil diperbarui',
        ];

    }

    public function getAttendanceMode(){
        $academicYear=AcademicYear::where('status', 'active')->first();

        return [
            'attendance_mode'=>$academicYear->attendance_mode
        ];
    }

        public function getNextEvent()
    {
        $today = Carbon::now()->format('Y-m-d');

        $nextEvent = Event::whereDate('start_date', '>=', $today)
            ->orderBy('start_date', 'asc')
            ->first();

        $prevEvent = Event::whereDate('start_date', '<', $today)
            ->orderBy('start_date', 'desc')
            ->first();

        return [
            'next_event' => $nextEvent ,
            'previous_event' => $prevEvent 
        ];
    }
}
