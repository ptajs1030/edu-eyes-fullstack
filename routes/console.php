<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

app()->make(App\Console\Commands\MakeService::class);
app()->make(App\Console\Commands\MakeDto::class);

// Schedule::command('attendance:generate-shifting')
//     //->dailyAt('00:00')
//     // ->everyFiveMinutes()
//     ->everyMinute()
//     ->timezone('Asia/Jakarta')
//     ->before(function () {
//         Log::info('[Scheduler] Mulai jalanin generate-shifting');
//     })
//     ->after(function () {
//         Log::info('[Scheduler] Selesai jalanin generate-shifting');
//     })
//     ->appendOutputTo(storage_path('logs/attendance-error.log'));
Schedule::command('attendance:generate-shifting')
    ->everyMinute()
    ->withoutOverlapping()
    ->timezone('Asia/Jakarta');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
