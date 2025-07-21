<?php

namespace App\Services;

use App\DTOs\AuthData;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Attempt to login a user with the given credentials.
     *
     * @param  \App\DTOs\AuthData  $data
     * @return \App\Models\User
     *
     * @throws \Illuminate\Auth\AuthenticationException
     */
    public function login(AuthData $data)
    {
        $user = User::where('username', $data->getUsername())->first();

        if (!$user || !Hash::check($data->getPassword(), $user->password)) {
            abort(400, 'Username atau password salah');
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
                abort(404, 'Tidak ada siswa yang ditemukan untuk orang tua ini');
            }

            $response['student_id'] = $student->id;
        }

        return $response;
    }


    /**
     * Logout the current user.
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Auth\AuthenticationException
     */
    public function logout()
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthorized');
        }

        $user->tokens()->delete();
        return [
            'message' => 'Log-out berhasil',
        ];
    }
}