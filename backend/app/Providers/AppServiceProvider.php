<?php

namespace App\Providers;

use App\Listeners\StripeEventListener;
use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\BusinessAboutSection;
use App\Models\BusinessService;
use App\Observers\BusinessAboutSectionObserver;
use App\Observers\BusinessImageObserver;
use App\Observers\BusinessObserver;
use App\Observers\BusinessServiceObserver;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookReceived;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Cashier::ignoreRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(WebhookReceived::class, StripeEventListener::class);

        Route::bind('business', function (string $value) {
            return Business::withTrashed()->whereKey($value)->firstOrFail();
        });

        // Invalidación automática del cache de la página pública en cualquier escritura Eloquent
        // sobre Business / BusinessImage / BusinessService (controllers, jobs, comandos, listeners).
        // Para operaciones bulk vía DB::table() o query()->update() usar App\Support\PublicPageCache directamente.
        Business::observe(BusinessObserver::class);
        BusinessImage::observe(BusinessImageObserver::class);
        BusinessService::observe(BusinessServiceObserver::class);
        BusinessAboutSection::observe(BusinessAboutSectionObserver::class);

        // En local el frontend (vite) proxyfica /api hacia el contenedor "nginx", así que las
        // requests llegan con Host=nginx. Sin esto, las URLs firmadas (verificación de email,
        // reset de password…) saldrían como http://nginx/... y no resolverían en el navegador.
        // Forzamos el root URL a APP_URL para que las URLs absolutas siempre apunten al host
        // visible desde el navegador (http://localhost). En producción usamos la del request real.
        if (! $this->app->environment('production')) {
            $appUrl = (string) config('app.url');
            if ($appUrl !== '') {
                URL::forceRootUrl($appUrl);
                if (str_starts_with($appUrl, 'https://')) {
                    URL::forceScheme('https');
                }
            }
        }
    }
}
