<?php

namespace App\Providers;

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
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
        Validator::extend('base64image', function ($attribute, $value, $parameters, $validator) {
            if (strpos($value, 'data:image') !== 0) {
                return false;
            }

            $image = explode(',', $value)[1];
            $image = str_replace(' ', '+', $image);
            $decoded = base64_decode($image, true);

            if ($decoded === false) {
                return false;
            }

            // Check image size (max 2MB)
            if (strlen($decoded) > 2 * 1024 * 1024) {
                return false;
            }

            return true;
        });

        Validator::replacer('base64image', function ($message, $attribute, $rule, $parameters) {
            return str_replace(':attribute', $attribute, 'The :attribute must be a valid image (max 2MB)');
        });
    }
}
