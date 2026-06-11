<?php

namespace App\Providers;

use App\Listeners\StripeEventListener;
use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\BusinessAboutSection;
use App\Models\BusinessService;
use App\Models\Template;
use App\Observers\BusinessAboutSectionObserver;
use App\Observers\BusinessImageObserver;
use App\Observers\BusinessObserver;
use App\Observers\BusinessServiceObserver;
use App\Observers\TemplateObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
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

        $this->app->bind(\App\Services\Ai\AiProviderContract::class, function () {
            return new \App\Services\Ai\ClaudeProvider(
                apiKey: config('ai.claude_api_key'),
                model: config('ai.model'),
                timeoutSeconds: config('ai.timeout_seconds'),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(WebhookReceived::class, StripeEventListener::class);

        // Rate limiter para los endpoints de generación con IA. El ÚNICO límite que
        // el usuario debe poder alcanzar es la cuota mensual (config('ai.monthly_limit'),
        // 50 por defecto), que devuelve un 429 con el mensaje "has agotado tu cuota
        // mensual". Para que nunca aparezca un 429 genérico de "Too Many Requests"
        // aunque el usuario gaste toda su cuota en pocos minutos, el límite por minuto
        // se fija holgadamente por encima del tope mensual: así la petición que agota
        // la cuota siempre llega al controlador y recibe el mensaje correcto.
        $aiPerMinute = max(60, (int) config('ai.monthly_limit') + 20);
        RateLimiter::for('ai', function (Request $request) use ($aiPerMinute) {
            $key = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute($aiPerMinute)->by('ai:' . $key);
        });

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
        Template::observe(TemplateObserver::class);

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
