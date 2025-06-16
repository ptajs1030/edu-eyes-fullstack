<?php

namespace App\Services;

use App\DTOs\AuthData;
use App\DTOs\UserData;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthTeacherService
{
    public function addUser(UserData $data)
    {
        $user = User::create([
            'full_name' => $data->getFullName(),
            'username' => $data->getUsername(),
            'email' => $data->getEmail(),
            'phone' => $data->getPhone(),
            'password' => Hash::make($data->getPassword()),
            'role_id' => 1,
        ]);
        return $user;
    }

    public function showWithLogic()
    {
        // masukkan logic disini lalu di return sesuai Modelnya
        $users = User::where('role_id', 2)->get();

        if ($users->isEmpty()) {
            abort(204, "Data Kosong"); // atau gunakan kode lain seperti 204, 422, dsb sesuai kebutuhan
        }

        return $users;
    }

    public function login(AuthData $body)
    {
        $user = User::where('username', $body->getUsername())->first();

        if (!$user || !Hash::check($body->getPassword(), $user->password)) {
            abort(401, 'Username or password is incorrect');
        }
        Auth::login($user);
        return [
            'token' => $user->createToken('authToken')->plainTextToken,
            'user' => $user
        ];
    }
}
