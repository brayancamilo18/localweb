<?php

use App\Http\Controllers\Api\Ai\GenerateController as AiGenerateController;
use App\Http\Controllers\Api\Account\AccountController;
use App\Http\Controllers\Api\Account\ProfileController;
use App\Http\Controllers\Api\Account\ReferralsController;
use App\Http\Controllers\Api\Account\SecurityEventsController;
use App\Http\Controllers\Api\Account\SessionsController;
use App\Http\Controllers\Api\Admin\BusinessesController as AdminBusinessesController;
use App\Http\Controllers\Api\Admin\TemplatesController as AdminTemplatesController;
use App\Http\Controllers\Api\Admin\UsersController as AdminUsersController;
use App\Http\Controllers\Api\Admin\PingController;
use App\Http\Controllers\Api\Admin\StatsController as AdminStatsController;
use App\Http\Controllers\Api\Auth\Social\CompleteRegistrationController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\Social\GoogleCallbackController;
use App\Http\Controllers\Api\Auth\Social\GoogleRedirectController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\QrController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use App\Http\Controllers\Api\Auth\Social\SocialMeController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\Dashboard\BusinessController as DashboardBusinessController;
use App\Http\Controllers\Api\Dashboard\ImagesController;
use App\Http\Controllers\Api\Dashboard\AboutSectionsController;
use App\Http\Controllers\Api\Dashboard\EventsController;
use App\Http\Controllers\Api\Dashboard\ServicesController;
use App\Http\Controllers\Api\Dashboard\StatsController;
use App\Http\Controllers\Api\Dashboard\TemplatesController;
use App\Http\Controllers\Api\Dashboard\BrandColorController;
use App\Http\Controllers\Api\Dashboard\TemplateChangeController;
use App\Http\Controllers\Api\Dashboard\TemplateChangePreviewController;
use App\Http\Controllers\Api\Onboarding\DraftGalleryController;
use App\Http\Controllers\Api\Onboarding\DraftLogoController;
use App\Http\Controllers\Api\Onboarding\ResetController;
use App\Http\Controllers\Api\Onboarding\StatusController;
use App\Http\Controllers\Api\Onboarding\TemplatesController as OnboardingTemplatesController;
use App\Http\Controllers\Api\Onboarding\StepController;
use App\Http\Controllers\Api\Public\BusinessController as PublicBusinessController;
use App\Http\Controllers\Api\Public\StorageMediaController;
use App\Http\Controllers\Api\Public\SubdomainRulesController;
use App\Http\Controllers\Api\Public\TenantExistsController;
use App\Http\Controllers\Api\Public\VCardController;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        // Registro: 3/min/IP. AuthService añade rate limiting por email+IP solo a login.
        Route::post('/register', RegisterController::class)->middleware('throttle:3,1');
        Route::post('/login', LoginController::class)->middleware('throttle:10,1');
        Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:5,1');
        Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:10,1');
        Route::get('/google/redirect', GoogleRedirectController::class)->middleware('throttle:10,1');
        Route::get('/google/callback', GoogleCallbackController::class)->middleware([
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
            'throttle:30,1',
        ]);
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/auth/logout', LogoutController::class)->middleware('throttle:60,1');
        Route::get('/auth/me', MeController::class)->middleware('throttle:120,1');
        Route::post('/auth/social/complete-registration', CompleteRegistrationController::class)->middleware('throttle:5,1');
        Route::get('/auth/social/me', SocialMeController::class)->middleware('throttle:60,1');

        // Reenvío del email de verificación. Limitado a 6 intentos/hora.
        Route::post('/auth/email/verification-notification', function (Request $request) {
            if ($request->user()->hasVerifiedEmail()) {
                return response()->json(['message' => 'Ya verificado'], 200);
            }
            $request->user()->sendEmailVerificationNotification();

            return response()->json(['message' => 'Email reenviado'], 202);
        })->middleware('throttle:6,60')->name('verification.send');

        Route::post('/billing/checkout', [BillingController::class, 'checkout'])->middleware('throttle:60,1');
        Route::post('/billing/confirm-checkout', [BillingController::class, 'confirmCheckout'])->middleware('throttle:120,1');
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
            Route::get('/referrals', [ReferralsController::class, 'index'])->middleware(['throttle:60,1', 'pro.features']);
            Route::get('/sessions', [SessionsController::class, 'index'])->middleware('throttle:30,1');
            Route::post('/sessions/revoke-others', [SessionsController::class, 'destroyOthers'])->middleware('throttle:6,1');
            Route::get('/security-events', [SecurityEventsController::class, 'index'])->middleware('throttle:30,1');
            Route::delete('/', [AccountController::class, 'destroy'])->middleware('throttle:3,1');
        });

        Route::prefix('qr')->group(function (): void {
            Route::get('/info', [QrController::class, 'info'])->middleware('throttle:60,1');
            Route::get('/png', [QrController::class, 'png'])->middleware('throttle:30,1');
            Route::post('/poster', [QrController::class, 'poster'])->middleware(['throttle:15,1', 'pro.features']);
        });

        Route::prefix('ai')->middleware(['verified.api', 'social.registration.complete'])->group(function (): void {
            Route::get('/quota', [AiGenerateController::class, 'quota'])->middleware('throttle:60,1');
            Route::get('/usage', [AiGenerateController::class, 'usage'])->middleware('throttle:60,1');
            Route::post('/intro-seen', [AiGenerateController::class, 'introSeen'])->middleware('throttle:30,1');
            // Endpoints que consumen cuota: el único límite visible para el usuario es
            // la cuota mensual (429 con mensaje de cuota agotada). El throttle 'ai' está
            // fijado por encima del tope mensual para que nunca salte un "Too Many Requests".
            Route::post('/business-description', [AiGenerateController::class, 'businessDescription'])->middleware('throttle:ai');
            Route::post('/about-section', [AiGenerateController::class, 'aboutSection'])->middleware('throttle:ai');
            Route::post('/about-block-description', [AiGenerateController::class, 'aboutBlockDescription'])
                ->middleware(['throttle:ai', 'pro.features']);
            Route::post('/service-description', [AiGenerateController::class, 'serviceDescription'])
                ->middleware(['throttle:ai', 'pro.features']);
            Route::post('/improve-text', [AiGenerateController::class, 'improveText'])
                ->middleware(['pro.features', 'throttle:ai']);
            Route::post('/social-post', [AiGenerateController::class, 'socialPost'])
                ->middleware(['pro.features', 'throttle:ai']);
        });

        Route::prefix('onboarding')->middleware(['verified.api', 'social.registration.complete'])->group(function (): void {
            Route::get('/status', StatusController::class)->middleware('throttle:60,1');
            Route::post('/reset', ResetController::class)->middleware('throttle:30,1');
            Route::get('/draft-gallery/{index}', DraftGalleryController::class)
                ->whereNumber('index')
                ->middleware('throttle:60,1');
            Route::get('/draft-logo', DraftLogoController::class)->middleware('throttle:60,1');
            Route::get('/templates', OnboardingTemplatesController::class)->middleware('throttle:60,1');
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
                ->middleware('throttle:120,1');
        });

        Route::prefix('dashboard')->middleware(['verified.api', 'business.complete', 'throttle:300,1'])->group(function (): void {
            Route::get('/business', [DashboardBusinessController::class, 'show']);
            Route::put('/business', [DashboardBusinessController::class, 'update']);
            Route::put('/location', [DashboardBusinessController::class, 'updateLocation']);
            Route::post('/tour/complete', [DashboardBusinessController::class, 'completeTour']);
            Route::post('/tour/pro/complete', [DashboardBusinessController::class, 'completeProTour']);
            Route::post('/subdomain', [DashboardBusinessController::class, 'setSubdomain']);
            Route::get('/stats', StatsController::class);
            Route::get('/templates', TemplatesController::class);
            Route::get('/template/{template}/preview', TemplateChangePreviewController::class);
            Route::post('/template', TemplateChangeController::class);
            Route::get('/brand-color', [BrandColorController::class, 'show']);
            Route::put('/brand-color', [BrandColorController::class, 'update'])->middleware('pro.features');
            Route::post('/images', [ImagesController::class, 'store']);
            Route::patch('/images/{image}/focal', [ImagesController::class, 'updateFocal']);
            Route::delete('/images/{image}', [ImagesController::class, 'destroy']);
            Route::put('/images/reorder', [ImagesController::class, 'reorder']);
            Route::post('/logo', [ImagesController::class, 'storeLogo']);
            Route::delete('/logo', [ImagesController::class, 'destroyLogo']);
            Route::post('/favicon', [ImagesController::class, 'storeFavicon'])->middleware('pro.features');
            Route::delete('/favicon', [ImagesController::class, 'destroyFavicon'])->middleware('pro.features');
            Route::get('/services', [ServicesController::class, 'index']);
            Route::post('/services', [ServicesController::class, 'store']);
            Route::put('/services/reorder', [ServicesController::class, 'reorder']);
            Route::put('/services/{service}', [ServicesController::class, 'update']);
            Route::delete('/services/{service}', [ServicesController::class, 'destroy']);
            Route::get('/about-sections', [AboutSectionsController::class, 'index']);
            Route::post('/about-sections', [AboutSectionsController::class, 'store'])->middleware('pro.features');
            Route::put('/about-sections/{aboutSection}', [AboutSectionsController::class, 'update'])->middleware('pro.features');
            Route::delete('/about-sections/{aboutSection}', [AboutSectionsController::class, 'destroy'])->middleware('pro.features');
            Route::post('/about-sections/{aboutSection}/photo', [AboutSectionsController::class, 'uploadPhoto'])->middleware('pro.features');
            Route::delete('/about-sections/{aboutSection}/photo', [AboutSectionsController::class, 'deletePhoto'])->middleware('pro.features');
            Route::get('/events', [EventsController::class, 'index']);
            Route::post('/events', [EventsController::class, 'store'])->middleware('pro.features');
            Route::put('/events/{event}', [EventsController::class, 'update'])->middleware('pro.features');
            Route::delete('/events/{event}', [EventsController::class, 'destroy'])->middleware('pro.features');
            Route::post('/events/{event}/photo', [EventsController::class, 'uploadPhoto'])->middleware('pro.features');
            Route::delete('/events/{event}/photo', [EventsController::class, 'deletePhoto'])->middleware('pro.features');
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
