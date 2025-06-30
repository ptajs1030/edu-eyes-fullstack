<?php

namespace App\Services;

use App\DTOs\ForgotPasswordData;
use DB;
use Hash;
use Illuminate\Support\Facades\Password;
use Mail;
use Str;

class ForgotPasswordService
{
    public function sendLink(ForgotPasswordData $data)
    {

        Password::sendResetLink(
            ['email' => $data->getEmail()]
        );

        return [
            'message' => 'Password reset link sent to your email address.',
        ];
    }
}