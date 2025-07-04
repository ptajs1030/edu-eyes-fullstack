<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ForgotPassword;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\SampleAuthTeacherController;
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



Route::prefix('auth')->controller(AuthController::class)->group(function (){
    Route::post('/login', 'login');

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
    });
   
    Route::prefix('attendance')->controller(AttendanceController::class)->group(function () {
        Route::get('/history/in/', 'clockInHistory');
        Route::get('/history/out/', 'clockOutHistory');
        Route::post('/shifting/{id}', 'shiftingAttendance');
        Route::post('/edit/{id}', 'editAttendance');
    });
});


Route::prefix('parent')->middleware(['auth:sanctum', 'parent', ])->controller(ParentController::class)->group(function (){
    Route::middleware(['getCurrentStudent'])->group(function (){
        Route::group(['prefix' => 'profile'], function () {
            Route::get('/', 'profile');
            Route::post('/change-password', 'changePassword');
        });
        Route::get('/announcements/{id?}', 'getAnnouncements');
        
        Route::prefix('attendance')->group(function (){
            Route::get('/', 'todayAttendance');
            Route::get('/history', 'attendanceHistory');
        });
    });
    Route::get('/students/{id?}', 'getStudents');
});
