<?php

namespace App\Services;

use App\DTOs\ForgotPasswordData;
use Hash;
use Mail;
use Str;

class ForgotPasswordService
{
    public function sendLink(ForgotPasswordData $data){
        $token = Hash::make(Str::random(60));

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $data->getEmail()],
            [
                'token' => $token,
                'created_at' => now(),
            ]
        );
        
        $resetLink = route('password.reset', ['token' => $token, 'email' => $data->getEmail()]);

        Mail::send('email.email', ['resetUrl' => $resetLink, 'enmail'=>$data->getEmail()], function ($message) use ($data) {
            $message->from(config('mail.from.address'), config('mail.from.name'));
            $message->to($data->getEmail())->subject('Reset Password');
        });

        return [
            'message' => 'Password reset link sent to your email address.',
          
        ];

    }
}