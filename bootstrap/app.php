<?php

use App\Exceptions\ExceptionHandler;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'teacher'=> App\Http\Middleware\TeacherAuth::class,
            'parent'=> App\Http\Middleware\ParentAuth::class,
            'getCurrentStudent'=> App\Http\Middleware\GetCurrentStudent::class,
            'inject.student' => App\Http\Middleware\InjectStudentByQuery::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->renderable(function (Exception $e, $request) {
            if ($request->is('api/*')) {
                return ExceptionHandler::handleApiException($e, $request);
            }
        });
    })->create();
