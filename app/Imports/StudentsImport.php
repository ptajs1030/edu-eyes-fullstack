<?php

namespace App\Imports;

use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StudentsImport implements ToCollection, WithHeadingRow
{   
    
    private function transformDate($value, $format = 'Y-m-d'){
        try {
            if (is_numeric($value)) {
                return Date::excelToDateTimeObject($value)->format($format);
            }
            return \Carbon\Carbon::parse($value)->format($format);
        } catch (\Exception $e) {
            return null;
        }
    }
    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            // --- FULL NAME ---
            $fullName = isset($row['nama_lengkap']) ? preg_replace('/\s+/', ' ', trim($row['nama_lengkap'])) : null;
            if ($fullName === '' || $fullName === null) {
                throw new \Exception('nama lengkap wajib diisi');
            }

            // --- ENTRY YEAR ---
            $entryYear = isset($row['tahun_masuk']) ? trim($row['tahun_masuk']) : null;
            if ($entryYear === '' || $entryYear === null) {
                throw new \Exception('tahun masuk wajib diisi');
            }
            if (!preg_match('/^\d{4}$/', $entryYear) || (int)$entryYear < 2000 || (int)$entryYear > 2100) {
                throw new \Exception('format tahun masuk tidak valid');
            }

            // --- GENDER ---
            $gender = isset($row['jenis_kelamin']) ? strtolower(trim($row['jenis_kelamin'])) : null;
            if ($gender === '' || $gender === null) {
                throw new \Exception('jenis kelamin wajib diisi');
            }
            if (!in_array($gender, ['male', 'female'])) {
                throw new \Exception('jenis kelamin harus "male" atau "female"');
            }

            // Normalize and trim parent name
            $parentName = isset($row['nama_orang_tua']) ? preg_replace('/\s+/', ' ', trim($row['nama_orang_tua'])) : null;
            if ($parentName === '' || $parentName === null) {
                $parentName = null;
            }

            // Normalize and trim class name
            $className = isset($row['kelas']) ? preg_replace('/\s+/', ' ', trim($row['kelas'])) : null;
            if ($className === '' || $className === null) {
                $className = null;
            }

            // parent is required (must filled & exist in database)
            $parent = null;
            if ($parentName !== null) {
                $parent = User::where('full_name', $parentName)
                    ->whereHas('role', fn($q) => $q->where('name', 'parent'))
                    ->first();
            }

            if (!$parent) {
                throw new \Exception('data orang tua/wali tidak ditemukan');
            }

            // classroom is optional (but if exist in excel, data must be valid)
            $classroom = null;
            if ($className !== null) {
                $classroom = Classroom::where('name', $className)->first();
                if (!$classroom) {
                    throw new \Exception('data kelas tidak ditemukan');
                }
            }

            Student::create([
                'full_name'     => $fullName,
                'parent_id'     => $parent->id,
                'class_id'      => $classroom?->id,
                'nis'           => $row['nis'] ?? null,
                'entry_year'    => $entryYear,
                'gender'        => $gender,
                'status'        => strtolower($row['status']),
                'religion'      => $row['agama'],
                'birth_place'   => $row['tempat_lahir'],
                'date_of_birth' => $this->transformDate($row['tanggal_lahir']),
                'address'       => $row['alamat'],
            ]);
        }
    }
}
