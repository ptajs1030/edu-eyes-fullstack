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
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::resource('roles', RoleController::class);
    Route::resource('announcements', AnnouncementController::class);
    Route::resource('academic-years', AcademicYearController::class);
    Route::get('classrooms/{classroom}/history', [ClassroomController::class, 'history'])->name('classrooms.history');
    Route::resource('classrooms', ClassroomController::class);
    Route::prefix('classrooms/{classroom}')->group(function () {
        Route::get('schedule', [ClassroomScheduleController::class, 'showScheduleForm'])
            ->name('classrooms.schedule');
        Route::post('schedule', [ClassroomScheduleController::class, 'saveSchedule'])
            ->name('classrooms.schedule.save');
    });
    Route::resource('students', StudentController::class);
    Route::resource('shiftings', ShiftingController::class);
    Route::resource('school-settings', SchoolSettingController::class);
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/parents/search', [UserController::class, 'searchParents'])->name('parents.search');
    Route::get('/teachers/search', [UserController::class, 'searchTeachers'])->name('teachers.search');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
