<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class UsersImport implements ToModel, WithHeadingRow
{
    private int $roleId;

    public function __construct(int $roleId)
    {
        $this->roleId = $roleId;
    }

    public function model(array $row)
    {
        return new User([
            'role_id'   => $this->roleId,
            'full_name' => $row['full_name'] ?? null,
            'username'  => $row['username'] ?? null,
            'email'     => $row['email'] ?? null,
            'phone'     => $row['phone'] ?? null,
            'address'   => $row['address'] ?? null,
            'status'    => $row['status'] ?? 'inactive',
            'job'       => $row['job'] ?? null,
            'nip'       => $row['nip'] ?? null,
            'position'  => $row['position'] ?? null,
            'password'  => isset($row['password']) ? Hash::make($row['password']) : Hash::make('password123'),
        ]);
    }
}
