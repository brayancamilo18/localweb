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
        $csrfExceptions = ['stripe/webhook'];

        // En testing exoneramos CSRF: las pruebas usan actingAs($user) y no manejan tokens
        // XSRF. En producción y dev real, el SPA obtiene el token vía /sanctum/csrf-cookie.
        // Nota: este closure se ejecuta antes de que el contenedor tenga 'env' bindeado,
        // así que usamos env('APP_ENV') directamente en lugar de app()->environment().
        if (env('APP_ENV') === 'testing') {
            $csrfExceptions[] = '*';
        }

        $middleware->validateCsrfTokens(except: $csrfExceptions);

        // Auth SPA: aplica EnsureFrontendRequestsAreStateful al grupo `api` para que
        // las peticiones desde un dominio listado en SANCTUM_STATEFUL_DOMAINS reciban
        // cookies de sesión (HttpOnly) y validen CSRF en mutaciones, en vez de bearer.
        $middleware->statefulApi();

        $middleware->appendToGroup('api', [
            \App\Http\Middleware\ResolveTenantSubdomain::class,
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
