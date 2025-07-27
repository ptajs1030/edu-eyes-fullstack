<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Factory;

class FirebaseServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(Messaging::class, function ($app) {
            $config = file_get_contents(storage_path('edu-eyes-dev-firebase.json'));
            $factory = (new Factory)->withServiceAccount($config);

            return $factory->createMessaging();
        });
    }
}
