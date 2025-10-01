<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use Maatwebsite\Excel\DefaultValueBinder;

class UsersImport extends DefaultValueBinder implements
    ToModel,
    WithHeadingRow,
    WithValidation,
    SkipsEmptyRows,
    WithCustomValueBinder
{
    use Importable, SkipsFailures;

    public function __construct(private int $roleId)
    {
        $this->inserted = 0;
    }

    private int $inserted;

    public function bindValue(Cell $cell, $value)
    {
        // Paksa semua cell dibaca sebagai STRING untuk menghindari
        // pembulatan/format angka oleh Excel (phone, nip, password, dll).
        $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);
        return true;
    }

    // Normalisasi sederhana sebelum mapping
    private function norm(?string $v): ?string
    {
        $v = is_null($v) ? null : trim($v);
        return $v === '' ? null : $v;
    }

    private function digitsOnly(?string $v): ?string
    {
        $v = $this->norm($v);
        return is_null($v) ? null : preg_replace('/\D+/', '', $v);
    }

    public function rules(): array
    {
        return [
            'nama_lengkap' => ['required', 'string', 'max:70'],
            'username'  => ['required', 'string', 'max:70', Rule::unique('users', 'username')],
            'password'  => ['required', 'string', 'min:8', 'max:100'],

            'email'     => ['nullable', 'email', 'max:100', Rule::unique('users', 'email')],
            'nomor_telepon'     => ['nullable', 'regex:/^\d{7,15}$/'], // 7-15 digit (boleh diatur)
            'alamat'   => ['nullable', 'string', 'max:255'],

            // role-specific
            'pekerjaan'       => ['nullable', 'string', 'max:70'],
            'nip'       => ['nullable', 'regex:/^\d{18,18}$/'], // 18-18 digit
            'posisi'  => ['nullable', 'string', 'max:70'],
        ];
    }

    public function customValidationMessages()
    {
        return [
            'nama_lengkap.required' => 'Nama lengkap wajib diisi',
            'username.required'     => 'Username wajib diisi',
            'username.unique'       => 'Username sudah digunakan',
            'password.required'     => 'Password wajib diisi',
            'email.email'           => 'Format email tidak valid',
            'email.unique'          => 'Email sudah digunakan',
            'nomor_telepon.regex'   => 'Nomor telepon harus 7-15 digit',
            'nip.regex'             => 'NIP harus angka (18 digit)',
        ];
    }

    public function model(array $row)
    {
        // Normalisasi nilai
        $fullName = $this->norm($row['nama_lengkap'] ?? null);
        $username = $this->norm($row['username'] ?? null);
        $email    = $this->norm($row['email'] ?? null);
        $phone    = $this->digitsOnly($row['nomor_telepon'] ?? null);
        $address  = $this->norm($row['alamat'] ?? null);
        $password = $this->norm($row['password'] ?? null);

        $job      = $this->norm($row['pekerjaan'] ?? null);
        $nip      = $this->digitsOnly($row['nip'] ?? null);
        $position = $this->norm($row['posisi'] ?? null);

        $this->inserted++;

        return new User([
            'role_id'   => $this->roleId,
            'full_name' => $fullName,
            'username'  => $username,
            'email'     => $email,
            'phone'     => $phone,
            'address'   => $address,
            'status'    => 'active',
            'job'       => $job,
            'nip'       => $nip,
            'position'  => $position,
            'password'  => Hash::make($password ?? 'eduEyes123'),
        ]);
    }

    public function getInsertedCount(): int
    {
        return $this->inserted;
    }

    public function prepareForValidation($data, $index)
    {
        if (isset($data['nip'])) {
            // Remove ALL spaces before validating
            $data['nip'] = preg_replace('/\s+/', '', $data['nip']);
        }

        return $data;
    }
}
