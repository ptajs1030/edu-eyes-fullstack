<?php

use App\Http\Controllers\AcademicYearController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\ShiftingController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::resource('announcements', AnnouncementController::class);
    Route::resource('academic-years', AcademicYearController::class);
    Route::resource('classrooms', ClassroomController::class);
    Route::resource('students', StudentController::class);
    Route::resource('shiftings', ShiftingController::class);
    Route::resource('school-settings', SchoolSettingController::class);
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/parents/search', [UserController::class, 'searchParents'])->name('parents.search');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
