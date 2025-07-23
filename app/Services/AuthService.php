<?php

namespace App\Services;

use App\DTOs\AuthData;
use App\Exceptions\SilentHttpException;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Handle an authentication attempt.
     *
     * @param  \App\DTOs\AuthData  $data
     * @return array
     */
    public function login(AuthData $data)
    {
        $user = User::where('username', $data->getUsername())->first();

        if (!$user || !Hash::check($data->getPassword(), $user->password)) {
           throw new SilentHttpException(400, 'Username atau password salah');
        }

        Auth::login($user);
        $token = $user->createToken('authToken')->plainTextToken;

        $response = [
            'user' => $user->load('role'),
            'token' => $token,
        ];

        if ($user->role->name === 'parent') {
            $studentId = request()->header('X-Student-ID');

            $student = null;
            if ($studentId) {
                $student = Student::where('id', $studentId)
                            ->where('parent_id', $user->id)
                            ->first();
            }

            if (!$student) {
                $student = Student::where('parent_id', $user->id)->first();
            }

            if (!$student) {
                throw new SilentHttpException(404, 'Tidak ada siswa yang ditemukan untuk orang tua ini.');
            }

            $response['student_id'] = $student->id;
        }

        return $response;
    }



    /**
     * Logout user and delete all personal access token.
     *
     * @return array
     *
     * @throws \App\Exceptions\SilentHttpException
     */
    public function logout()
    {
        $user = Auth::user();

        if (!$user) {
            throw new SilentHttpException(401, 'Unauthorized');
        }

        $user->tokens()->delete();
        return [
            'message' => 'Log-out berhasil',
        ];
    }
}
