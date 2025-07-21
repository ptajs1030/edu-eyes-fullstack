<?php

namespace App\Services;

use App\DTOs\ChangePasswordData;

class TeacherService
{
    public function changePassword(ChangePasswordData $data ){
        $user=auth()->user();

        if (!$user){
            return abort(404, 'Pengguna tidak ditemukan');
        }else if (!password_verify($data->getOldPassword(), $user->password)) {
            return abort(400, 'Password lama salah');
        }

        $user->password = bcrypt($data->getNewPassword());
        $user->save();
        return [
            'message' => 'Password berhasil diubah',
        ];

    }
}