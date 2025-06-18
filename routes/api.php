<?php

use App\Http\Controllers\Api\AuthController;
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


Route::prefix('auth/teacher')->controller(AuthController::class)->group(function (){
    Route::post('/login', 'login');

    Route::middleware(['auth:sanctum', 'teacher'])->group(function () {
        Route::post('/logout', 'logout');
    });
});

Route::prefix('auth/parent')->controller(AuthController::class)->group(function (){
    Route::post('/login', 'login');

    Route::middleware(['auth:sanctum', 'parent'])->group(function () {
        Route::post('/logout', 'logout');
    });
});

Route::prefix('teacher')->middleware(['auth:sanctum', 'teacher'])->controller(TeacherController::class)->group(function (){
    Route::get('/profile', 'profile');
});

Route::prefix('parent')->middleware(['auth:sanctum', 'parent'])->controller(ParentController::class)->group(function (){
    Route::get('/profile', 'profile');
});
