<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Classroom;
use App\Models\Subject;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;

class SchoolStatsController extends Controller
{
    public function index(): JsonResponse
    {
        $siswa = Student::where('status', 'active')->count();
        $guru = User::where('role_id', function($q) { $q->select('id')->from('roles')->where('name', 'teacher'); })->where('status', 'active')->count();
        $admin = User::where('role_id', function($q) { $q->select('id')->from('roles')->where('name', 'admin'); })->where('status', 'active')->count();
        $orangTua = User::where('role_id', function($q) { $q->select('id')->from('roles')->where('name', 'parent'); })->where('status', 'active')->count();
        $kelas = Classroom::count();
        $mataPelajaran = Subject::count();
        $tahunAkademik = AcademicYear::where('status', 'active')->first()?->title ?? '-';

        return response()->json([
            'siswa' => $siswa,
            'guru' => $guru,
            'admin' => $admin,
            'orangTua' => $orangTua,
            'kelas' => $kelas,
            'mataPelajaran' => $mataPelajaran,
            'tahunAkademik' => $tahunAkademik,
        ]);
    }
}
