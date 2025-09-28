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

    private function debugRow($row, $index)
    {
        $rowData = [];
        foreach ($row->toArray() as $key => $value) {
            $rowData[$key] = [
                'value' => $value,
                'type' => gettype($value),
                'is_empty' => empty($value) ? 'YES' : 'NO',
                'is_null' => is_null($value) ? 'YES' : 'NO'
            ];
        }

        Log::info("=== DEBUG ROW {$index} ===");
        Log::info("All keys available: " . implode(', ', array_keys($row->toArray())));
        Log::info("Row data details:", $rowData);
    }

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

    private function normalizeName($name)
    {
        if (empty($name)) return null;

        return Str::of($name)
            ->trim()
            ->replaceMatches('/\s+/', ' ')
            ->toString(); // Jangan di lowercase agar matching exact
    }

    private function findParent($parentName)
    {
        if (empty($parentName)) {
            Log::info("Parent name is empty, skipping search");
            return null;
        }

        Log::info("Searching for parent: '{$parentName}'");

        // Pencarian bertahap: dari yang paling exact sampai yang paling longgar
        $parent = User::whereHas('role', fn($q) => $q->where('name', 'parent'))
            ->where(function ($query) use ($parentName) {
                // 1. Exact match (case insensitive, trim spaces)
                $query->whereRaw('LOWER(TRIM(full_name)) = LOWER(TRIM(?))', [$parentName])

                    // 2. Contains match
                    ->orWhere('full_name', 'LIKE', '%' . trim($parentName) . '%')

                    // 3. Soundex matching untuk typo tolerance
                    ->orWhereRaw('SOUNDEX(full_name) = SOUNDEX(?)', [trim($parentName)]);
            })
            ->first();

        if ($parent) {
            Log::info("✅ Parent found: ID {$parent->id}, Name: '{$parent->full_name}'");
        } else {
            Log::info("❌ Parent NOT found for: '{$parentName}'");

            // Debug: Lihat parent yang ada di database
            $allParents = User::whereHas('role', fn($q) => $q->where('name', 'parent'))
                ->limit(10)
                ->pluck('full_name')
                ->toArray();
            Log::info("Available parents in DB: " . implode(', ', $allParents));
        }

        return $parent;
    }

    private function findClassroom($className)
    {
        if (empty($className)) {
            Log::info("Class name is empty, skipping search");
            return null;
        }

        Log::info("Searching for classroom: '{$className}'");

        // Normalize input class name
        $normalizedClassName = $this->normalizeClassName($className);
        Log::info("Normalized class name: '{$normalizedClassName}'");

        // Pencarian bertahap
        $classroom = null;

        // 1. Exact match (case insensitive)
        $classroom = Classroom::whereRaw('LOWER(TRIM(name)) = LOWER(TRIM(?))', [$className])->first();
        if ($classroom) {
            Log::info("✅ Classroom found (exact match): ID {$classroom->id}, Name: '{$classroom->name}'");
            return $classroom;
        }

        // 2. Contains match
        $classroom = Classroom::where('name', 'LIKE', '%' . trim($className) . '%')->first();
        if ($classroom) {
            Log::info("✅ Classroom found (contains match): ID {$classroom->id}, Name: '{$classroom->name}'");
            return $classroom;
        }

        // 3. Fuzzy match dengan similarity
        $classrooms = Classroom::all();
        $bestMatch = null;
        $highestSimilarity = 0;

        foreach ($classrooms as $class) {
            $similarity = $this->calculateSimilarity($normalizedClassName, $this->normalizeClassName($class->name));

            Log::info("Similarity between '{$normalizedClassName}' and '{$this->normalizeClassName($class->name)}': {$similarity}");

            if ($similarity > $highestSimilarity && $similarity > 0.6) { // Threshold 60%
                $highestSimilarity = $similarity;
                $bestMatch = $class;
            }
        }

        if ($bestMatch) {
            Log::info("✅ Classroom found (fuzzy match): ID {$bestMatch->id}, Name: '{$bestMatch->name}', Similarity: " . ($highestSimilarity * 100) . "%");
            return $bestMatch;
        }

        // 4. Soundex matching sebagai fallback
        $classroom = Classroom::whereRaw('SOUNDEX(name) = SOUNDEX(?)', [trim($className)])->first();
        if ($classroom) {
            Log::info("✅ Classroom found (soundex match): ID {$classroom->id}, Name: '{$classroom->name}'");
            return $classroom;
        }

        Log::info("❌ Classroom NOT found for: '{$className}'");

        // Debug: tampilkan semua kelas yang tersedia
        $allClassrooms = Classroom::pluck('name')->toArray();
        Log::info("Available classrooms in DB: " . implode(', ', $allClassrooms));

        return null;
    }

    private function normalizeClassName($className)
    {
        return Str::of($className)
            ->lower()
            ->replace(['/', '\\', '-', '.'], ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->toString();
    }

    private function calculateSimilarity($str1, $str2)
    {
        similar_text($str1, $str2, $percent);
        return $percent / 100;
    }

    private function validateRequiredFields($row, $index)
    {
        $rowNumber = $index + 2;

        // --- FULL NAME ---
        $fullName = $this->getRowValue($row, ['nama_lengkap', 'Nama Lengkap']);
        $fullName = $fullName ? preg_replace('/\s+/', ' ', trim($fullName)) : null;

        if (empty($fullName)) {
            throw new \Exception("Baris {$rowNumber}: Nama lengkap wajib diisi");
        }

        // --- ORANG TUA --- 
        // PERBAIKAN: Tambahkan variasi key yang sesuai dengan Excel
        $parentName = $this->getRowValue($row, [
            'orang_tuawali',  // Key yang sebenarnya di Excel
            'orang_tua_wali', // Key yang diharapkan
            'Orang Tua/Wali',
            'orang_tua',
            'wali',
            'nama_orang_tua'
        ]);
        $parentName = $parentName ? trim($parentName) : null;

        Log::info("Parent name extracted: '{$parentName}'");

        if (empty($parentName)) {
            throw new \Exception("Baris {$rowNumber}: Nama orang tua/wali wajib diisi");
        }

        // --- TAHUN MASUK ---
        $entryYear = $this->getRowValue($row, ['tahun_masuk', 'Tahun Masuk']);
        $entryYear = $entryYear ? trim($entryYear) : null;

        if (empty($entryYear)) {
            throw new \Exception("Baris {$rowNumber}: Tahun masuk wajib diisi");
        }
        if (!preg_match('/^\d{4}$/', $entryYear) || (int)$entryYear < 2000 || (int)$entryYear > 2100) {
            throw new \Exception("Baris {$rowNumber}: Format tahun masuk tidak valid (harus 4 digit, 2000-2100)");
        }

        // --- JENIS KELAMIN ---
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

        Log::info("=== STARTING STUDENT IMPORT ===");
        Log::info("Total rows to process: " . $rows->count());

        foreach ($rows as $index => $row) {
            try {
                $rowNumber = $index + 2;
                Log::info("=== PROCESSING ROW {$rowNumber} ===");

                // Validasi field required
                $validated = $this->validateRequiredFields($row, $index);

                $fullName = $validated['full_name'];
                $parentName = $validated['parent_name'];
                $entryYear = $validated['entry_year'];
                $gender = $validated['gender'];

                Log::info("Data extracted - Name: '{$fullName}', Parent: '{$parentName}', Year: {$entryYear}, Gender: {$gender}");

                // --- CARI ORANG TUA ---
                $parent = $this->findParent($parentName);

                if (!$parent) {
                    throw new \Exception("Baris {$rowNumber}: Orang tua '{$parentName}' tidak ditemukan di database. Pastikan nama orang tua sudah terdaftar sebagai role 'parent'.");
                }

                // --- KELAS (OPTIONAL) ---
                $className = $this->getRowValue($row, ['kelas', 'Kelas']);
                $className = $className ? preg_replace('/\s+/', ' ', trim($className)) : null;
                $classroom = null;

                if (!empty($className)) {
                    $classroom = $this->findClassroom($className);

                    if (!$classroom) {
                        // Warning saja, tidak error, karena kelas optional
                        Log::warning("⚠️ Classroom '{$className}' not found for student '{$fullName}'. Student will be imported without class.");
                    }
                }

                // --- CEK DUPLIKAT SISWA ---
                $existingStudent = Student::where('full_name', $fullName)
                    ->where('entry_year', $entryYear)
                    ->first();

                if ($existingStudent) {
                    throw new \Exception("Baris {$rowNumber}: Siswa '{$fullName}' dengan tahun masuk {$entryYear} sudah ada");
                }

                // --- GET OTHER OPTIONAL FIELDS ---
                $nis = $this->getRowValue($row, ['nis', 'NIS']);
                $religion = $this->getRowValue($row, ['agama', 'Agama']);
                $birthPlace = $this->getRowValue($row, ['tempat_lahir', 'Tempat Lahir']);
                $dateOfBirth = $this->getRowValue($row, ['tanggal_lahir', 'Tanggal Lahir']);
                $address = $this->getRowValue($row, ['alamat', 'Alamat']);

                // --- CREATE STUDENT ---
                Student::create([
                    'full_name'     => $fullName,
                    'parent_id'     => $parent->id,
                    'class_id'      => $classroom?->id,
                    'nis'           => $nis ? trim($nis) : null,
                    'entry_year'    => $entryYear,
                    'gender'        => $gender,
                    'status'        => 'active',
                    'religion'      => $religion ? trim($religion) : null,
                    'birth_place'   => $birthPlace ? trim($birthPlace) : null,
                    'date_of_birth' => $dateOfBirth ? $this->transformDate($dateOfBirth) : null,
                    'address'       => $address ? trim($address) : null,
                ]);

                Log::info("✅ Successfully imported student: {$fullName}");
            } catch (\Exception $e) {
                $errorMsg = $e->getMessage();
                $errors[] = $errorMsg;
                Log::error("❌ Import error: {$errorMsg}");
            }
        }

        if (!empty($errors)) {
            throw new \Exception(implode("\n", $errors));
        } else {
            Log::info("=== IMPORT COMPLETED SUCCESSFULLY ===");
        }
    }
}
