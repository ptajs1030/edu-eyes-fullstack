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
use App\Http\Controllers\GradePromotionController;
use App\Http\Controllers\StudentAttendanceController;
use App\Http\Controllers\ExamController;
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
    Route::prefix('admins')->group(function () {
        Route::get('/', [UserController::class, 'indexAdmin'])->name('admins.index');
        Route::post('/', [UserController::class, 'storeAdmin'])->name('admins.store');
        Route::put('/{user}', [UserController::class, 'updateAdmin'])->name('admins.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('admins.destroy');
    });
    Route::prefix('teachers')->group(function () {
        Route::get('/', [UserController::class, 'indexTeacher'])->name('teachers.index');
        Route::post('/', [UserController::class, 'storeTeacher'])->name('teachers.store');
        Route::put('/{user}', [UserController::class, 'updateTeacher'])->name('teachers.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('teachers.destroy');
    });
    Route::prefix('parents')->group(function () {
        Route::get('/', [UserController::class, 'indexParent'])->name('parents.index');
        Route::post('/', [UserController::class, 'storeParent'])->name('parents.store');
        Route::put('/{user}', [UserController::class, 'updateParent'])->name('parents.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('parents.destroy');
    });
    Route::resource('announcements', AnnouncementController::class);
    Route::resource('academic-years', AcademicYearController::class);
    Route::resource('classrooms', ClassroomController::class);
    Route::prefix('classrooms/{classroom}')->group(function () {
        Route::post('schedule/subject', [ClassroomScheduleController::class, 'saveSubjectSchedule'])->name('classrooms.schedule.subject.save');
        Route::post('schedule/shift', [ClassroomScheduleController::class, 'saveShiftSchedule'])->name('classrooms.schedule.shift.save');
        Route::get('schedule', [ClassroomScheduleController::class, 'showScheduleForm'])->name('classrooms.schedule');
        Route::get('history', [ClassroomController::class, 'history'])->name('classrooms.history');
    });
    Route::get('/classrooms/{id}/students', [ClassroomController::class, 'getStudents']);
    Route::resource('students', StudentController::class);
    Route::prefix('students/{student}')->group(function () {
        Route::get('attendance', [StudentAttendanceController::class, 'showAttendanceHistory'])->name('students.attendance');
        Route::patch('attendance/shift', [StudentAttendanceController::class, 'updateShiftAttendance'])->name('students.attendance.shift.save');
        Route::patch('attendance/subject', [StudentAttendanceController::class, 'updateSubjectAttendance'])->name('students.attendance.subject.save');
        Route::get('qrcode-preview', function (Student $student) {
            return QrCode::size(200)->generate($student->uuid); // returns SVG as raw HTML
        })->name('student.qrcode.preview');
    });
    Route::get('/kartu-siswa', [QRCodeController::class, 'generate'])->middleware('inject.student')->name('kartu-siswa');
    Route::post('/bulk-kartu-siswa', [QRCodeController::class, 'bulkGenerate'])->name('qrcode.bulk');
    Route::resource('subjects', SubjectController::class);
    Route::resource('shiftings', ShiftingController::class);
    Route::resource('school-settings', SchoolSettingController::class);
    Route::prefix('grade-promotions')->group(function () {
        Route::get('/', [GradePromotionController::class, 'index'])->name('grade-promotions.index');
        Route::get('/{classroom}', [GradePromotionController::class, 'showAssign'])->name('grade-promotions.show');
        Route::post('/', [GradePromotionController::class, 'finalize'])->name('grade-promotions.finalize');
        Route::post('/populate', [GradePromotionController::class, 'populateData'])->name('grade-promotions.populate');
        Route::post('/reset', [GradePromotionController::class, 'resetData'])->name('grade-promotions.reset');
        Route::post('/{classroom}/assign', [GradePromotionController::class, 'updateAssign'])->name('grade-promotions.update');
    });
    Route::resource('exams', ExamController::class);
    Route::get('/exams/create', [ExamController::class, 'create'])->name('exams.create');
    Route::get('/exams/{exam}/edit', [ExamController::class, 'edit'])->name('exams.edit');
    Route::put('/exams/{exam}', [ExamController::class, 'update'])->name('exams.update');
    Route::get('/exams/{exam}/scoring', [ExamController::class, 'scoring'])->name('exams.scoring');
    Route::put('/exams/{exam}/assignments/{assignment}/score', [ExamController::class, 'updateScore'])->name('exams.updateScore');
    Route::put('/exams/{exam}/scores/bulk', [ExamController::class, 'updateBulkScores'])->name('exams.updateBulkScores');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
