<?php

use App\Http\Controllers\AcademicYearController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ClassroomScheduleController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\ShiftingController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\QRCodeController;
use App\Http\Controllers\CustomDayOffController;
use App\Http\Controllers\StudentAttendanceController;
use App\Models\CustomDayOff;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Models\Student;

Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/parents/search', [UserController::class, 'searchParents'])->name('parents.search');
    Route::get('/teachers/search', [UserController::class, 'searchTeachers'])->name('teachers.search');
    Route::get('/subjects/search', [SubjectController::class, 'searchSubject'])->name('subjects.search');
    Route::get('/day-off/search', [CustomDayOffController::class, 'searchDayOff'])->name('dayOff.search');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::resource('roles', RoleController::class);
    Route::resource('users', UserController::class);
    Route::resource('announcements', AnnouncementController::class);
    Route::resource('academic-years', AcademicYearController::class);
    Route::resource('classrooms', ClassroomController::class);
    Route::prefix('classrooms/{classroom}')->group(function () {
        Route::post('schedule/subject', [ClassroomScheduleController::class, 'saveSubjectSchedule'])->name('classrooms.schedule.subject.save');
        Route::post('schedule/shift', [ClassroomScheduleController::class, 'saveShiftSchedule'])->name('classrooms.schedule.shift.save');
        Route::get('schedule', [ClassroomScheduleController::class, 'showScheduleForm'])->name('classrooms.schedule');
        Route::get('history', [ClassroomController::class, 'history'])->name('classrooms.history');
    });
    Route::resource('students', StudentController::class);
    Route::prefix('students/{student}')->group(function () {
        Route::get('attendance', [StudentAttendanceController::class, 'showAttendanceHistory'])->name('students.attendance');
        Route::patch('attendance/shift', [StudentAttendanceController::class, 'updateShiftAttendance'])->name('students.attendance.shift.save');
    });
    Route::get('/students/{student}/qrcode-preview', function (Student $student) {
        return QrCode::size(200)->generate($student->uuid); // returns SVG as raw HTML
    })->name('student.qrcode.preview');
    Route::get('/kartu-siswa', [QRCodeController::class, 'generate'])->middleware('inject.student')->name('kartu-siswa');
    Route::post('/bulk-kartu-siswa', [QRCodeController::class, 'bulkGenerate'])->name('qrcode.bulk');
    Route::resource('subjects', SubjectController::class);
    Route::resource('shiftings', ShiftingController::class);
    Route::resource('school-settings', SchoolSettingController::class);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
