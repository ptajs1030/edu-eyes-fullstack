<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

app()->make(App\Console\Commands\MakeService::class);
app()->make(App\Console\Commands\MakeDto::class);

Schedule::command('attendance:generate-shifting')
    ->dailyAt('00:00')
    ->timezone('Asia/Jakarta');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
