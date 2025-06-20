<?php

use App\Http\Controllers\Api\AuthTeacherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('sample')->group(function () {
    Route::get('/user/{id?}', [AuthTeacherController::class, 'show']);
    Route::get('/user-logic', [AuthTeacherController::class, 'showWithLogic']);
    Route::post('/user', [AuthTeacherController::class, 'addUser']);
    Route::post('/login', [AuthTeacherController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthTeacherController::class, 'user']);
    });
});
