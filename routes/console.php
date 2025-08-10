<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

app()->make(App\Console\Commands\MakeService::class);
app()->make(App\Console\Commands\MakeDto::class);

Schedule::command('attendance:generate-shifting')
    //->dailyAt('00:00')
    ->everyFiveMinutes()
    ->timezone('Asia/Jakarta')
    ->appendOutputTo(storage_path('logs/attendance-error.log'));

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
