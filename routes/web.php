<?php

use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\TaskController;
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
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventScheduleController;
use App\Http\Controllers\GradePromotionController;
use App\Http\Controllers\StudentAttendanceController;
use App\Http\Controllers\ExamController;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Models\Student;

Route::get('/', function () {
    return redirect('/login');
})->name('home');
Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])
    ->middleware('guest')
    ->name('password.request');

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('guest')
    ->name('password.email');

Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])
    ->middleware('guest')
    ->name('password.reset');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('guest')
    ->name('password.update');
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/parents/search', [UserController::class, 'searchParents'])->name('parents.search');
    Route::get('/teachers/search', [UserController::class, 'searchTeachers'])->name('teachers.search');
    Route::get('/students/classroom/{classroom}', [StudentController::class, 'getStudentsByClass'])->name('students.by-class');
    Route::get('students/by-ids', [StudentController::class, 'getStudentsByIds'])->name('students.get-by-ids');
    Route::get('/subjects/search', [SubjectController::class, 'searchSubject'])->name('subjects.search');
    Route::get('/day-off/search', [CustomDayOffController::class, 'searchDayOff'])->name('dayOff.search');
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard'); // Pastikan path ini sesuai
    })->name('dashboard');

    Route::resource('roles', RoleController::class);

    Route::prefix('admins')->group(function () {
        Route::get('/', [UserController::class, 'indexAdmin'])->name('admins.index');
        Route::post('/', [UserController::class, 'storeAdmin'])->name('admins.store');
        Route::put('/{user}', [UserController::class, 'updateAdmin'])->name('admins.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('admins.destroy');
        Route::put('/{user}/reset-password', [UserController::class, 'resetPassword'])->name('admins.reset-password');
    });

    Route::prefix('teachers')->group(function () {
        Route::get('/', [UserController::class, 'indexTeacher'])->name('teachers.index');
        Route::post('/', [UserController::class, 'storeTeacher'])->name('teachers.store');
        Route::put('/{user}', [UserController::class, 'updateTeacher'])->name('teachers.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('teachers.destroy');
        Route::put('/{user}/reset-password', [UserController::class, 'resetPassword'])->name('teachers.reset-password');
        Route::post('/import', [UserController::class, 'importTeacher'])->name('teachers.import');
    });

    Route::prefix('parents')->group(function () {
        Route::get('/', [UserController::class, 'indexParent'])->name('parents.index');
        Route::post('/', [UserController::class, 'storeParent'])->name('parents.store');
        Route::put('/{user}', [UserController::class, 'updateParent'])->name('parents.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('parents.destroy');
        Route::put('/{user}/reset-password', [UserController::class, 'resetPassword'])->name('parents.reset-password');
        Route::post('/import', [UserController::class, 'importParent'])->name('parents.import');
    });

    Route::get('/users/template/{role}', [UserController::class, 'downloadTemplate'])->name('users.template');
    Route::resource('payments', PaymentController::class);
    Route::patch('/payments/{payment}/transactions/update', [PaymentController::class, 'updateTransactions'])->name('payments.updateTransactions');
    // Route::post('/payments/{payment}/resend-notification', [PaymentController::class, 'resendNotification'])->name('payments.resend-notification');
    Route::post('/payments/{payment}/resend-notification', [PaymentController::class, 'manualResendNotification'])->name('payments.resend-notification');
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
    Route::resource('students', StudentController::class)->except(['show']);
    Route::get('/students/template', [StudentController::class, 'downloadTemplate'])->name('students.template');
    Route::post('/students/import', [StudentController::class, 'import'])->name('students.import');
    Route::prefix('students/{student}')->group(function () {
        Route::get('attendance', [StudentAttendanceController::class, 'showAttendanceHistory'])->name('students.attendance');
        Route::patch('attendance/shift', [StudentAttendanceController::class, 'updateShiftAttendance'])->name('students.attendance.shift.save');
        Route::patch('attendance/subject', [StudentAttendanceController::class, 'updateSubjectAttendance'])->name('students.attendance.subject.save');
        Route::get('qrcode-preview', function (Student $student) {
            return QrCode::size(200)->generate($student->uuid);
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
    Route::resource('tasks', TaskController::class);
    Route::get('/tasks/{task}/edit', [TaskController::class, 'edit'])->name('tasks.edit');
    Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::put('/tasks/{task}/assignments/{assignment}/score', [TaskController::class, 'updateScore'])->name('tasks.updateScore');
    Route::put('/tasks/{task}/scores/bulk', [TaskController::class, 'updateBulkScores'])->name('tasks.updateBulkScores');
    // Route::post('/tasks/{task}/resend-notification', [TaskController::class, 'resendNotification'])->name('tasks.resend-notification');
    Route::post('/tasks/{task}/resend-notification', [TaskController::class, 'manualResendNotification'])->name('tasks.resend-notification');

    Route::resource('events', EventController::class);

    Route::prefix('events/{event}')->group(function () {
        Route::get('/attendance', [EventScheduleController::class, 'showAttendance'])->name('events.attendance');
        Route::patch('/attendance', [EventScheduleController::class, 'updateAttendance'])->name('events.attendance.update');
    });

    Route::resource('custom-day-offs', CustomDayOffController::class);
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
