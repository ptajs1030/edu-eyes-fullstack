<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

app()->make(App\Console\Commands\MakeService::class);
app()->make(App\Console\Commands\MakeDto::class);

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
