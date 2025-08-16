<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ForgotPassword;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\QRCodeController;
use App\Http\Controllers\Api\SampleAuthTeacherController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TeacherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');


// Route::prefix('sample')->group(function (){
//     Route::get('/user/{id?}', [SampleAuthTeacherController::class, 'show']);
//     Route::get('/user-logic', [SampleAuthTeacherController::class, 'showWithLogic']);
//     Route::post('/user', [SampleAuthTeacherController::class, 'addUser']);
//     Route::post('/login', [SampleAuthTeacherController::class, 'login']);


//     Route::middleware('auth:sanctum')->group(function () {
//         Route::get('/me', [SampleAuthTeacherController::class, 'user']);

//     });
// });
Route::post("testNotification", [SampleAuthTeacherController::class, 'sendNotification']);

Route::get('/fcm-ping', function () {
    $path = storage_path(env('FIREBASE_CREDENTIALS'));
    return [
        'exists' => file_exists($path),
        'path' => $path,
        'can_read' => is_readable($path),
        'content_snippet' => file_exists($path) ? substr(file_get_contents($path), 0, 100) : null,
    ];
});

Route::prefix('auth')->controller(AuthController::class)->group(function (){
    Route::post('/login', 'login');
    Route::get('/help-center', 'helpCenter');
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/logout', 'logout');
    });

});

Route::controller(ForgotPasswordController::class)->group(function () {
    Route::post('auth/forgot-password', 'sendLink');
});

Route::middleware(['auth:sanctum', 'teacher'])->prefix('teacher')->group(function (){

    Route::controller(TeacherController::class)->group(function (){
        Route::get('/profile', 'profile');
        Route::post('/profile/change-password', 'changePassword');
        Route::get('/students/{id?}', 'getStudents');
        Route::get('/classrooms/{id?}', 'getClassrooms');
        Route::get('/subjects/{id?}', 'getSubjects');
        Route::get('/event/{id?}', 'getEvent');
    });

    Route::prefix('attendance')->controller(AttendanceController::class)->group(function () {
        Route::get('/history/in/', 'clockInHistory');
        Route::get('/history/out/', 'clockOutHistory');
        Route::post('/shifting', 'shiftingAttendance');
        Route::post('/edit/{id}', 'editAttendance');
        Route::get('/today-attendance', 'todayAttendance');

        Route::prefix('subject')->group(function () {
            Route::get('/classroom', 'getClassroomByTeacher');
            Route::get('/{class_id}/subjects', 'getClassroomSubject');
            Route::get('/{class_id}/{subject}', 'getSubjectAttendance');
            Route::post('/', 'subjectAttendance');
            Route::get('/history/{id?}', 'subjectAttendanceHistory');
            Route::post('/edit/{id}', 'editSubjectAttendance');
        });

        Route::prefix('event')->group(function () {
            Route::get('/history', 'eventAttendanceHistory');
            Route::get('/{id?}', 'getEvent');
            Route::post('/', 'eventAttendance');
            Route::post('/edit/{id}', 'editEventAttendance');
        });
    });
});


Route::prefix('parent')->middleware(['auth:sanctum', 'parent', ])->controller(ParentController::class)->group(function (){
    Route::middleware(['getCurrentStudent'])->group(function (){
        Route::group(['prefix' => 'profile'], function () {
            Route::get('/', 'profile');
            Route::post('/change-password', 'changePassword');
        });
        Route::get('/subject/{id?}', 'getSubject');
        Route::post('/set-notification-key', 'setNotificationKey');
        Route::get('/announcements/{id?}', 'getAnnouncements');
        Route::get('/subject-schedule', 'getSubjectSchedule');
        Route::get('/event-date/{date}', 'getEventDate');
        Route::get('/event-schedule', 'getEventSchedule');
        Route::get('/get-academic-year', 'getAcademicYear');
        Route::get('/payment', 'getPayment');
        Route::get('/unpaid-payment', 'getUnpaidPayment');
        Route::get('/payment-year', 'getPaymentYear');

        Route::prefix('attendance')->group(function (){
            Route::get('/', 'todayAttendance');
            Route::prefix('history')->group(function () {
                Route::get('/', 'attendanceHistory');
                Route::get('/subject', 'subjectAttendanceHistory');
                Route::get('/event', 'eventAttendanceHistory');
            });
        });

        Route::prefix('kartu-siswa')->group(function () {
            Route::get('/', 'studentIdCard');
            Route::controller(QRCodeController::class)->group(function () {
                Route::get('/download', 'generate');
            });
        });

        Route::prefix('exams')->controller(ExamController::class)->group(function () {
            Route::get('/', 'getSubject');
            Route::get('/{subject}', 'getExam');
        });

        Route::prefix('tasks')->controller(TaskController::class)->group(function () {
            Route::get('/', 'getTasks');
            Route::get('/{id}', 'getTaskDetails');
        });
    });
    Route::get('/students/{id?}', 'getStudents');
});
