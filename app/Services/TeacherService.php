<?php

namespace App\Services;

use App\DTOs\ChangePasswordData;
use App\Exceptions\SilentHttpException;

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
            'message' => 'Password berhasil diubah',
        ];

    }
}
