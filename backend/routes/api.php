<?php

use App\Http\Controllers\Api\Account\ProfileController;
use App\Http\Controllers\Api\Account\ReferralsController;
use App\Http\Controllers\Api\Admin\BusinessesController as AdminBusinessesController;
use App\Http\Controllers\Api\Admin\TemplatesController as AdminTemplatesController;
use App\Http\Controllers\Api\Admin\UsersController as AdminUsersController;
use App\Http\Controllers\Api\Admin\PingController;
use App\Http\Controllers\Api\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\QrController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\Dashboard\BusinessController as DashboardBusinessController;
use App\Http\Controllers\Api\Dashboard\ImagesController;
use App\Http\Controllers\Api\Dashboard\ServicesController;
use App\Http\Controllers\Api\Dashboard\StatsController;
use App\Http\Controllers\Api\Dashboard\TemplatesController;
use App\Http\Controllers\Api\Onboarding\DraftGalleryController;
use App\Http\Controllers\Api\Onboarding\DraftLogoController;
use App\Http\Controllers\Api\Onboarding\StatusController;
use App\Http\Controllers\Api\Onboarding\StepController;
use App\Http\Controllers\Api\Public\BusinessController as PublicBusinessController;
use App\Http\Controllers\Api\Public\StorageMediaController;
use App\Http\Controllers\Api\Public\SubdomainRulesController;
use App\Http\Controllers\Api\Public\TenantExistsController;
use App\Http\Controllers\Api\Public\VCardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        // Registro: 3/min/IP. AuthService añade rate limiting por email+IP solo a login.
        Route::post('/register', RegisterController::class)->middleware('throttle:3,1');
        Route::post('/login', LoginController::class)->middleware('throttle:10,1');
        Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:5,1');
        Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:10,1');
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/auth/logout', LogoutController::class)->middleware('throttle:60,1');
        Route::get('/auth/me', MeController::class)->middleware('throttle:120,1');

        // Reenvío del email de verificación. Limitado a 6 intentos/hora.
        Route::post('/auth/email/verification-notification', function (Request $request) {
            if ($request->user()->hasVerifiedEmail()) {
                return response()->json(['message' => 'Ya verificado'], 200);
            }
            $request->user()->sendEmailVerificationNotification();

            return response()->json(['message' => 'Email reenviado'], 202);
        })->middleware('throttle:6,60')->name('verification.send');

        Route::post('/billing/checkout', [BillingController::class, 'checkout'])->middleware('throttle:60,1');
        Route::post('/billing/portal', [BillingController::class, 'portal'])->middleware('throttle:60,1');
        Route::get('/billing/status', [BillingController::class, 'status'])->middleware('throttle:60,1');
        Route::get('/billing/invoices', [BillingController::class, 'invoices'])->middleware('throttle:60,1');
        Route::get('/billing/invoices/{invoiceId}/download', [BillingController::class, 'downloadInvoice'])
            ->where('invoiceId', '[A-Za-z0-9_]+')
            ->middleware('throttle:30,1');
        Route::get('/billing/payment-method', [BillingController::class, 'paymentMethod'])->middleware('throttle:60,1');
        Route::get('/billing/upcoming', [BillingController::class, 'upcoming'])->middleware('throttle:60,1');
        Route::post('/billing/cancel', [BillingController::class, 'cancel'])->middleware('throttle:10,1');
        Route::post('/billing/resume', [BillingController::class, 'resume'])->middleware('throttle:10,1');

        // Cuenta del usuario: datos personales y contraseña.
        // No usa `verified.api` a propósito porque el cambio de email es
        // precisamente la vía que tiene el usuario cuando ha perdido acceso
        // al correo anterior.
        Route::prefix('account')->group(function (): void {
            Route::get('/profile', [ProfileController::class, 'show'])->middleware('throttle:60,1');
            Route::patch('/profile', [ProfileController::class, 'update'])->middleware('throttle:30,1');
            Route::post('/password', [ProfileController::class, 'password'])->middleware('throttle:6,1');
            Route::get('/referrals', [ReferralsController::class, 'index'])->middleware('throttle:60,1');
        });

        Route::prefix('qr')->group(function (): void {
            Route::get('/info', [QrController::class, 'info'])->middleware('throttle:60,1');
            Route::get('/png', [QrController::class, 'png'])->middleware('throttle:30,1');
            Route::post('/poster', [QrController::class, 'poster'])->middleware('throttle:15,1');
        });

        Route::prefix('onboarding')->middleware('verified.api')->group(function (): void {
            Route::get('/status', StatusController::class)->middleware('throttle:60,1');
            Route::get('/draft-gallery/{index}', DraftGalleryController::class)
                ->whereNumber('index')
                ->middleware('throttle:60,1');
            Route::get('/draft-logo', DraftLogoController::class)->middleware('throttle:60,1');
            Route::get('/templates', TemplatesController::class)->middleware('throttle:60,1');
            Route::post('/step/1', [StepController::class, 'step1'])->middleware('throttle:60,1');
            Route::post('/step/2', [StepController::class, 'step2'])->middleware('throttle:30,1');
            Route::post('/step/3', [StepController::class, 'step3'])->middleware('throttle:60,1');
            Route::post('/step/4', [StepController::class, 'step4'])->middleware('throttle:30,1');
            Route::post('/step/5', [StepController::class, 'step5'])->middleware('throttle:60,1');
            Route::post('/step/6', [StepController::class, 'step6'])->middleware('throttle:60,1');
            Route::post('/step/7', [StepController::class, 'step7'])->middleware('throttle:60,1');
            Route::post('/step/8', [StepController::class, 'step8'])->middleware('throttle:60,1');
            // Cierra el onboarding (set onboarding_completed_at). Lo dispara Step9 al
            // pulsar «Ir a mi dashboard» en planes Pro/Pending; para Free lo hace step8.
            Route::post('/finalize', [StepController::class, 'completeOnboarding'])
                ->middleware('throttle:30,1');
        });

        Route::prefix('dashboard')->middleware(['verified.api', 'business.complete', 'throttle:60,1'])->group(function (): void {
            Route::get('/business', [DashboardBusinessController::class, 'show']);
            Route::put('/business', [DashboardBusinessController::class, 'update']);
            Route::post('/tour/complete', [DashboardBusinessController::class, 'completeTour']);
            Route::post('/tour/pro/complete', [DashboardBusinessController::class, 'completeProTour']);
            Route::post('/subdomain', [DashboardBusinessController::class, 'setSubdomain']);
            Route::get('/stats', StatsController::class);
            Route::get('/templates', TemplatesController::class);
            Route::post('/images', [ImagesController::class, 'store']);
            Route::delete('/images/{image}', [ImagesController::class, 'destroy']);
            Route::put('/images/reorder', [ImagesController::class, 'reorder']);
            Route::post('/logo', [ImagesController::class, 'storeLogo']);
            Route::delete('/logo', [ImagesController::class, 'destroyLogo']);
            Route::get('/services', [ServicesController::class, 'index']);
            Route::post('/services', [ServicesController::class, 'store']);
            Route::put('/services/reorder', [ServicesController::class, 'reorder']);
            Route::put('/services/{service}', [ServicesController::class, 'update']);
            Route::delete('/services/{service}', [ServicesController::class, 'destroy']);
        });
    });

    Route::prefix('admin')->middleware(['auth:sanctum', 'admin', 'throttle:60,1'])->group(function (): void {
        Route::get('/ping', PingController::class);
        Route::get('/users', [AdminUsersController::class, 'index']);
        Route::post('/users/{user}/resend-verification', [AdminUsersController::class, 'resendVerification']);
        Route::get('/stats/overview', [AdminStatsController::class, 'overview']);
        Route::get('/stats/sectors', [AdminStatsController::class, 'sectors']);
        Route::get('/stats/templates', [AdminStatsController::class, 'templates']);
        Route::get('/templates', [AdminTemplatesController::class, 'index']);
        Route::patch('/templates/{template}/toggle-active', [AdminTemplatesController::class, 'toggleActive']);
        Route::patch('/templates/{template}/toggle-pro', [AdminTemplatesController::class, 'togglePro']);
        Route::get('/stats/top-pages', [AdminStatsController::class, 'topPages']);
        Route::get('/stats/timeseries', [AdminStatsController::class, 'timeSeries']);
        Route::get('/businesses', [AdminBusinessesController::class, 'index']);
        Route::get('/businesses/{business}', [AdminBusinessesController::class, 'show']);
        Route::patch('/businesses/{business}/toggle-publish', [AdminBusinessesController::class, 'togglePublish']);
        Route::post('/businesses/{business}/restore', [AdminBusinessesController::class, 'restore']);
        Route::delete('/businesses/{business}/force', [AdminBusinessesController::class, 'forceDelete']);
        Route::patch('/businesses/{business}', [AdminBusinessesController::class, 'update']);
        Route::delete('/businesses/{business}', [AdminBusinessesController::class, 'destroy']);
    });

    Route::get('/media/{path}', [StorageMediaController::class, 'show'])
        ->where('path', '.*')
        ->middleware('throttle:300,1')
        ->name('media.show');

    Route::prefix('public')->middleware('throttle:120,1')->group(function (): void {
        Route::get('/subdomain-rules', SubdomainRulesController::class);
        Route::get('/tenants/{subdomain}/exists', [TenantExistsController::class, 'show'])
            ->middleware('throttle:60,1');
        Route::get('/{subdomain}/vcard', [VCardController::class, 'download']);
        Route::get('/{subdomain}', [PublicBusinessController::class, 'show']);
        Route::post('/{subdomain}/track', [PublicBusinessController::class, 'track']);
    });
});
