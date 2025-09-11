<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
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

// Hanya jalan antara 00:00 - 00:05 WIB
Schedule::command('attendance:generate-shifting')
    ->everyMinute()
    ->withoutOverlapping()
    ->timezone('Asia/Jakarta');

// Hanya jalan antara 00:05 - 00:10 WIB
Schedule::command('check:payment-deadlines')
    ->everyMinute()
    ->withoutOverlapping()
    // ->dailyAt('01:00')
    ->timezone('Asia/Jakarta')
    ->before(function () {
        Log::info('Starting payment deadline check...');
    })
    ->after(function () {
        Log::info('Payment deadline check completed');
    });

// Hanya jalan antara 00:10 - 00:15 WIB
Schedule::command('check:task-deadlines')
    ->everyMinute()
    ->withoutOverlapping()
    // ->dailyAt('02:00')
    ->timezone('Asia/Jakarta')
    ->before(function () {
        Log::info('Starting task deadline check...');
    })
    ->after(function () {
        Log::info('Task deadline check completed');
    });

// Hanya jalan antara 00:15 - 00:20 WIB
Schedule::command('attendance:generate-event')
    ->everyMinute()
    ->withoutOverlapping()
    ->timezone('Asia/Jakarta')
    ->before(function () {
        Log::info('Starting task deadline check...');
    })
    ->after(function () {
        Log::info('Task deadline check completed');
    });

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
