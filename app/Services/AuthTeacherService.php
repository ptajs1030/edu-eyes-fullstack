<?php

namespace App\Services;

use App\DTOs\AuthData;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthTeacherService
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
            abort(401, 'Unauthorized');
        }

        Auth::login($user);
        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
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

        Auth::logout();
        return response()->json(['message' => 'Successfully logged out']);
    }
}