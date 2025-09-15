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
         
            if (empty($row['nama_lengkap'])) {
                continue;
            }

  
            $parent = User::where('full_name', trim($row['nama_orang_tua']))
                ->whereHas('role', fn($q) => $q->where('name', 'parent'))
                ->first();

            if (!$parent) {
                
                continue;
            }

            
            $classroom = null;
            if (!empty($row['kelas'])) {
                $classroom = Classroom::where('name', trim($row['kelas']))->first();
            }

            Student::create([
                'full_name'     => $row['nama_lengkap'],
                'parent_id'     => $parent->id,
                'class_id'      => $classroom?->id,
                'nis'           => $row['nis'] ?? null,
                'entry_year'    => $row['tahun_masuk'],
                'gender'        => strtolower($row['jenis_kelamin']),
                'status'        => strtolower($row['status']),
                'religion'      => $row['agama'],
                'birth_place'   => $row['tempat_lahir'],
                'date_of_birth' => $this->transformDate($row['tanggal_lahir']),
                'address'       => $row['alamat'],
            ]);
        }
    }
}
