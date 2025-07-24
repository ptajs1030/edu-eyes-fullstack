<?php

namespace App\Providers;

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::aliasMiddleware('role', RoleMiddleware::class);
        Inertia::share([
            'schoolLogo' => function () {
                $logo = \App\Models\Setting::where('key', 'school_logo')->value('value');
                return $logo ? asset('storage/' . $logo) : null;
            },
            'schoolName' => function () {
                $school_name = \App\Models\Setting::where('key', 'school_name')->value('value');
                return $school_name ?? 'The School';
            },
        ]);
    }
}
