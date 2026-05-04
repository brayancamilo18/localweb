<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\Dashboard\BusinessController as DashboardBusinessController;
use App\Http\Controllers\Api\Dashboard\ImagesController;
use App\Http\Controllers\Api\Dashboard\ServicesController;
use App\Http\Controllers\Api\Dashboard\StatsController;
use App\Http\Controllers\Api\Dashboard\TemplatesController;
use App\Http\Controllers\Api\Onboarding\DraftGalleryController;
use App\Http\Controllers\Api\Onboarding\StatusController;
use App\Http\Controllers\Api\Onboarding\StepController;
use App\Http\Controllers\Api\Public\BusinessController as PublicBusinessController;
use App\Http\Controllers\Api\Public\VCardController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->middleware('throttle:10,1')->group(function (): void {
        Route::post('/register', RegisterController::class);
        Route::post('/login', LoginController::class);
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/auth/logout', LogoutController::class)->middleware('throttle:10,1');
        Route::get('/auth/me', MeController::class)->middleware('throttle:120,1');
        Route::post('/billing/checkout', [BillingController::class, 'checkout'])->middleware('throttle:60,1');
        Route::post('/billing/portal', [BillingController::class, 'portal'])->middleware('throttle:60,1');
        Route::get('/billing/status', [BillingController::class, 'status'])->middleware('throttle:60,1');

        Route::prefix('onboarding')->group(function (): void {
            Route::get('/status', StatusController::class)->middleware('throttle:60,1');
            Route::get('/draft-gallery/{index}', DraftGalleryController::class)
                ->whereNumber('index')
                ->middleware('throttle:60,1');
            Route::get('/templates', TemplatesController::class)->middleware('throttle:60,1');
            Route::post('/step/1', [StepController::class, 'step1'])->middleware('throttle:60,1');
            Route::post('/step/2', [StepController::class, 'step2'])->middleware('throttle:30,1');
            Route::post('/step/3', [StepController::class, 'step3'])->middleware('throttle:60,1');
            Route::post('/step/4', [StepController::class, 'step4'])->middleware('throttle:30,1');
            Route::post('/step/5', [StepController::class, 'step5'])->middleware('throttle:60,1');
            Route::post('/step/6', [StepController::class, 'step6'])->middleware('throttle:60,1');
            Route::post('/step/7', [StepController::class, 'step7'])->middleware('throttle:60,1');
            Route::post('/step/8', [StepController::class, 'step8'])->middleware('throttle:60,1');
        });

        Route::prefix('dashboard')->middleware(['business.complete', 'throttle:60,1'])->group(function (): void {
            Route::get('/business', [DashboardBusinessController::class, 'show']);
            Route::put('/business', [DashboardBusinessController::class, 'update']);
            Route::get('/stats', StatsController::class);
            Route::get('/templates', TemplatesController::class);
            Route::post('/images', [ImagesController::class, 'store'])->middleware('throttle:30,1');
            Route::delete('/images/{image}', [ImagesController::class, 'destroy']);
            Route::put('/images/reorder', [ImagesController::class, 'reorder']);
            Route::get('/services', [ServicesController::class, 'index']);
            Route::post('/services', [ServicesController::class, 'store'])->middleware('throttle:30,1');
            Route::put('/services/reorder', [ServicesController::class, 'reorder']);
            Route::put('/services/{service}', [ServicesController::class, 'update']);
            Route::delete('/services/{service}', [ServicesController::class, 'destroy']);
        });
    });

    Route::prefix('public')->middleware('throttle:120,1')->group(function (): void {
        Route::get('/{subdomain}/vcard', [VCardController::class, 'download']);
        Route::get('/{subdomain}', [PublicBusinessController::class, 'show']);
        Route::post('/{subdomain}/track', [PublicBusinessController::class, 'track']);
    });
});
