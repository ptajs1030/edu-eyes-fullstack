<?php

namespace App\Imports;

use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Str;

class StudentsImport implements ToCollection, WithHeadingRow
{
    private function transformDate($value, $format = 'Y-m-d')
    {
        try {
            if (is_numeric($value)) {
                return Date::excelToDateTimeObject($value)->format($format);
            }
            return \Carbon\Carbon::parse($value)->format($format);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function normalizeKey($key)
    {
        if (is_null($key)) return '';

        return Str::of($key)
            ->lower()
            ->replace(['/', '\\', '-', '.'], ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->replace(' ', '_')
            ->toString();
    }

    private function getRowValue($row, $possibleKeys)
    {
        foreach ($possibleKeys as $key) {
            $normalizedKey = $this->normalizeKey($key);

            // Cek key asli
            if (isset($row[$key])) {
                return $row[$key];
            }

            // Cek normalized key terhadap semua keys yang ada
            foreach ($row as $rowKey => $value) {
                $normalizedRowKey = $this->normalizeKey($rowKey);

                if ($normalizedRowKey === $normalizedKey) {
                    return $value;
                }
            }
        }

        return null;
    }

    private function findParent($parentName)
    {
        if (empty($parentName)) {
            return null;
        }

        $parentName = trim($parentName);

        return User::whereHas('role', fn($q) => $q->where('name', 'parent'))
            ->where(function ($query) use ($parentName) {
                $query->where('full_name', 'LIKE', "%{$parentName}%")
                    ->orWhereRaw('LOWER(full_name) = LOWER(?)', [$parentName]);
            })
            ->first();
    }

    private function findClassroom($className)
    {
        if (empty($className)) {
            return null;
        }

        $className = trim($className);

        return Classroom::where('name', 'LIKE', "%{$className}%")
            ->orWhereRaw('LOWER(name) = LOWER(?)', [$className])
            ->first();
    }

    private function validateRequiredFields($row, $index)
    {
        $rowNumber = $index + 2;

        // Validasi Nama Lengkap
        $fullName = $this->getRowValue($row, ['nama_lengkap', 'Nama Lengkap']);
        $fullName = $fullName ? preg_replace('/\s+/', ' ', trim($fullName)) : null;

        if (empty($fullName)) {
            throw new \Exception("Baris {$rowNumber}: Nama lengkap wajib diisi");
        }

        // Validasi Orang Tua/Wali
        $parentName = $this->getRowValue($row, [
            'orang_tuawali',
            'orang_tua_wali',
            'Orang Tua/Wali',
            'orang_tua',
            'wali'
        ]);
        $parentName = $parentName ? trim($parentName) : null;

        if (empty($parentName)) {
            throw new \Exception("Baris {$rowNumber}: Nama orang tua/wali wajib diisi");
        }

        // Validasi Tahun Masuk
        $entryYear = $this->getRowValue($row, ['tahun_masuk', 'Tahun Masuk']);
        $entryYear = $entryYear ? trim($entryYear) : null;

        if (empty($entryYear)) {
            throw new \Exception("Baris {$rowNumber}: Tahun masuk wajib diisi");
        }
        if (!preg_match('/^\d{4}$/', $entryYear) || (int)$entryYear < 2000 || (int)$entryYear > 2100) {
            throw new \Exception("Baris {$rowNumber}: Format tahun masuk tidak valid (harus 4 digit, 2000-2100)");
        }

        // Validasi Jenis Kelamin
        $gender = $this->getRowValue($row, ['jenis_kelamin', 'Jenis Kelamin']);
        $gender = $gender ? strtolower(trim($gender)) : null;

        if (empty($gender)) {
            throw new \Exception("Baris {$rowNumber}: Jenis kelamin wajib diisi");
        }

        $genderMap = [
            'male' => 'male',
            'laki-laki' => 'male',
            'laki' => 'male',
            'pria' => 'male',
            'l' => 'male',
            'female' => 'female',
            'perempuan' => 'female',
            'wanita' => 'female',
            'p' => 'female'
        ];

        if (!isset($genderMap[$gender])) {
            throw new \Exception("Baris {$rowNumber}: Jenis kelamin harus 'male', 'female', 'laki-laki', atau 'perempuan'. Diterima: '{$gender}'");
        }

        return [
            'full_name' => $fullName,
            'parent_name' => $parentName,
            'entry_year' => $entryYear,
            'gender' => $genderMap[$gender]
        ];
    }

    public function collection(Collection $rows)
    {
        $errors = [];

        Log::info("Starting student import process. Total rows: " . $rows->count());

        foreach ($rows as $index => $row) {
            try {
                $rowNumber = $index + 2;

                // Validasi field required
                $validated = $this->validateRequiredFields($row, $index);

                $fullName = $validated['full_name'];
                $parentName = $validated['parent_name'];
                $entryYear = $validated['entry_year'];
                $gender = $validated['gender'];

                // Cari Parent
                $parent = $this->findParent($parentName);
                if (!$parent) {
                    throw new \Exception("Baris {$rowNumber}: Orang tua '{$parentName}' tidak ditemukan di database");
                }

                // Cari Kelas (Optional)
                $className = $this->getRowValue($row, ['kelas', 'Kelas']);
                $className = $className ? trim($className) : null;
                $classroom = null;

                if (!empty($className)) {
                    $classroom = $this->findClassroom($className);
                    if (!$classroom) {
                        throw new \Exception("Baris {$rowNumber}: Kelas '{$className}' tidak ditemukan");
                    }
                }

                // Cek Duplikat Siswa
                $existingStudent = Student::where('full_name', $fullName)
                    ->where('entry_year', $entryYear)
                    ->first();

                if ($existingStudent) {
                    throw new \Exception("Baris {$rowNumber}: Siswa '{$fullName}' dengan tahun masuk {$entryYear} sudah ada");
                }

                // Ambil data optional lainnya
                $studentData = [
                    'full_name'     => $fullName,
                    'parent_id'     => $parent->id,
                    'class_id'      => $classroom?->id,
                    'entry_year'    => $entryYear,
                    'gender'        => $gender,
                    'status'        => 'active',
                    'nis'           => $this->getOptionalField($row, ['nis', 'NIS']),
                    'religion'      => $this->getOptionalField($row, ['agama', 'Agama']),
                    'birth_place'   => $this->getOptionalField($row, ['tempat_lahir', 'Tempat Lahir']),
                    'date_of_birth' => $this->getDateField($row, ['tanggal_lahir', 'Tanggal Lahir']),
                    'address'       => $this->getOptionalField($row, ['alamat', 'Alamat']),
                ];

                // Create Student
                Student::create($studentData);

                Log::info("Successfully imported student: {$fullName}");
            } catch (\Exception $e) {
                $errors[] = $e->getMessage();
                Log::error("Import error at row {$rowNumber}: " . $e->getMessage());
            }
        }

        if (!empty($errors)) {
            throw new \Exception(implode("\n", $errors));
        }

        Log::info("Student import completed successfully");
    }

    /**
     * Helper method untuk field optional
     */
    private function getOptionalField($row, $possibleKeys)
    {
        $value = $this->getRowValue($row, $possibleKeys);
        return $value ? trim($value) : null;
    }

    /**
     * Helper method untuk field tanggal
     */
    private function getDateField($row, $possibleKeys)
    {
        $value = $this->getRowValue($row, $possibleKeys);
        return $value ? $this->transformDate($value) : null;
    }
}
