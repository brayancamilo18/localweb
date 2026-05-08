<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'stripe/webhook',
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureIsAdmin::class,
            'business.complete' => \App\Http\Middleware\EnsureBusinessComplete::class,
            'pro.features' => \App\Http\Middleware\EnsureProFeatures::class,
            'verified.api' => \App\Http\Middleware\EnsureEmailVerified::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
