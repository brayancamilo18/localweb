<?php

use App\Http\Controllers\PublicRobotsController;
use App\Http\Controllers\PublicSitemapController;
use App\Http\Controllers\PublicTenantPageController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Middleware\ResolveTenantForWeb;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Laravel\Cashier\Http\Controllers\PaymentController;

// ─── Rutas públicas de tenant (subdominios de negocio) ───────────────────────
// Registradas antes de GET / (home): Laravel prioriza la primera ruta coincidente.
// El dominio {subdomain}.{tenant_suffix} evita colisión con la ruta raíz en localhost/app.onez.es.
// ResolveTenantForWeb resuelve el negocio y adjunta tenant_business al request.

Route::middleware(ResolveTenantForWeb::class)
    ->domain('{subdomain}.'.config('localweb.domains.tenant_suffix'))
    ->group(function (): void {
        Route::get('/robots.txt', [PublicRobotsController::class, 'show'])
            ->name('tenant.robots');

        Route::get('/sitemap.xml', [PublicSitemapController::class, 'tenant'])
            ->name('tenant.sitemap');

        Route::get('/', [PublicTenantPageController::class, 'show'])
            ->name('tenant.page');
    });

Route::get('/', function () {
    return view('welcome');
})->name('home');

// Verificación de email a través del link firmado del correo. NO requiere sesión activa
// (el usuario puede hacer click desde otro dispositivo). La firma y el hash del email
// son las dos protecciones; coincide con el comportamiento de Illuminate\Foundation\Auth\EmailVerificationRequest
// pero sin depender de auth().
Route::get('/email/verify/{id}/{hash}', function (Request $request, string $id, string $hash) {
    $user = User::find($id);

    if (! $user) {
        abort(404);
    }

    if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        abort(403);
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    // Auto-login tras verificar para garantizar que el usuario aterrice en el flujo
    // autenticado sin importar el dispositivo desde el que abra el correo.
    // El link está firmado (signed middleware) y caduca en 60 min, así que es seguro
    // tratar el click como prueba de propiedad del email y por tanto de la cuenta.
    Auth::guard('web')->login($user, remember: true);
    $request->session()->regenerate();

    return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/');
})->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

Route::prefix(config('cashier.path', 'stripe'))->name('cashier.')->group(function (): void {
    Route::get('payment/{id}', [PaymentController::class, 'show'])->name('payment');
    Route::post('webhook', [StripeWebhookController::class, 'handleWebhook'])->name('webhook');
});

// Sitemap maestro — solo en el dominio raíz (no en subdominios de tenant)
// Se registra fuera del grupo anterior para que no pase por ResolveTenantForWeb
Route::get('/sitemap-index.xml', [PublicSitemapController::class, 'master'])
    ->name('sitemap.master');

// Panel React admin (SPA): en producción nginx puede enviar /admin/* a Laravel.
// Filament vive en /filament; aquí devolvemos index.html para que refresh funcione.
Route::get('/admin/{spaPath?}', function () {
    $index = config('app.frontend_dist_index');
    if (! is_string($index) || ! is_file($index)) {
        abort(404);
    }

    return response()->file($index, ['Content-Type' => 'text/html; charset=UTF-8']);
})->where('spaPath', '.*')->name('spa.admin');
