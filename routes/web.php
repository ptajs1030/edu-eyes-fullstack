<?php

use App\Http\Controllers\AcademicYearController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\StudentController;

Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::resource('announcements', AnnouncementController::class);
    Route::resource('academic-years', AcademicYearController::class);
    Route::resource('students', StudentController::class);
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/parents/search', [StudentController::class, 'searchParents'])->name('parents.search');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
