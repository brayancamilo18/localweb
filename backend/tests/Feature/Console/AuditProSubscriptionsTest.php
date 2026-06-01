<?php

use App\Mail\ProSubscriptionDriftAlert;
use App\Models\Business;
use App\Models\ProDriftAlert;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function makeProBusinessWithoutStripe(): array
{
    $b = Business::create([
        'name' => 'Pro Comp',
        'subdomain' => 'pro-comp-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'plan_activated_at' => now()->subDays(30),
    ]);
    $u = User::factory()->create(['business_id' => $b->id, 'stripe_id' => null]);

    return [$b, $u];
}

function makeProBusinessWithStripeButNoSubscription(): array
{
    $b = Business::create([
        'name' => 'Pro Drift',
        'subdomain' => 'pro-drift-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'plan_activated_at' => now()->subDays(10),
    ]);
    $u = User::factory()->create([
        'business_id' => $b->id,
        'stripe_id' => 'cus_drift_'.uniqid('', true),
    ]);

    return [$b, $u];
}

function makeProBusinessWithActiveSubscription(): array
{
    [$b, $u] = makeProBusinessWithStripeButNoSubscription();
    $u->subscriptions()->create([
        'type' => 'default',
        'stripe_id' => 'sub_active_'.uniqid('', true),
        'stripe_status' => 'active',
        'stripe_price' => 'price_pro_test',
        'quantity' => 1,
    ]);

    return [$b, $u];
}

function makeFreeBusinessWithActiveSubscription(): array
{
    $b = Business::create([
        'name' => 'Free Paying',
        'subdomain' => 'free-pay-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);
    $u = User::factory()->create([
        'business_id' => $b->id,
        'stripe_id' => 'cus_freepay_'.uniqid('', true),
    ]);
    $u->subscriptions()->create([
        'type' => 'default',
        'stripe_id' => 'sub_freepay_'.uniqid('', true),
        'stripe_status' => 'active',
        'stripe_price' => 'price_pro_test',
        'quantity' => 1,
    ]);

    return [$b, $u];
}

it('Pro sin stripe_id se cuenta como comp account y NO genera alerta', function () {
    Mail::fake();
    [$b, $u] = makeProBusinessWithoutStripe();

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    expect(ProDriftAlert::open()->where('business_id', $b->id)->count())->toBe(0);
});

it('Pro con stripe_id sin suscripción genera alerta pro_without_subscription', function () {
    Mail::fake();
    [$b, $u] = makeProBusinessWithStripeButNoSubscription();

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    $alert = ProDriftAlert::open()->where('business_id', $b->id)->first();
    expect($alert)->not->toBeNull()
        ->and($alert->drift_type)->toBe('pro_without_subscription')
        ->and($alert->stripe_customer_id)->toBe($u->stripe_id)
        ->and($alert->plan_value)->toBe('pro');
});

it('Pro con suscripción activa NO genera alerta', function () {
    Mail::fake();
    [$b, $u] = makeProBusinessWithActiveSubscription();

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    expect(ProDriftAlert::open()->where('business_id', $b->id)->count())->toBe(0);
});

it('Free con suscripción activa genera alerta free_with_subscription', function () {
    Mail::fake();
    [$b, $u] = makeFreeBusinessWithActiveSubscription();

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    $alert = ProDriftAlert::open()->where('business_id', $b->id)->first();
    expect($alert)->not->toBeNull()
        ->and($alert->drift_type)->toBe('free_with_subscription')
        ->and($alert->plan_value)->toBe('free');
});

it('al ejecutar dos veces seguidas no duplica alertas (idempotente)', function () {
    Mail::fake();
    [$b, $u] = makeProBusinessWithStripeButNoSubscription();

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);
    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    expect(ProDriftAlert::where('business_id', $b->id)->count())->toBe(1);
});

it('cuando un drift previamente detectado se resuelve, la alerta se cierra', function () {
    Mail::fake();
    [$b, $u] = makeProBusinessWithStripeButNoSubscription();

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);
    expect(ProDriftAlert::open()->where('business_id', $b->id)->count())->toBe(1);

    $u->subscriptions()->create([
        'type' => 'default',
        'stripe_id' => 'sub_recovered_'.uniqid('', true),
        'stripe_status' => 'active',
        'stripe_price' => 'price_pro_test',
        'quantity' => 1,
    ]);

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    expect(ProDriftAlert::open()->where('business_id', $b->id)->count())->toBe(0)
        ->and(ProDriftAlert::where('business_id', $b->id)->whereNotNull('resolved_at')->count())->toBe(1);
});

it('Pending con plan_activated_at reciente NO se considera stale', function () {
    Mail::fake();
    $b = Business::create([
        'name' => 'Pending Reciente',
        'subdomain' => 'pend-r-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pending',
        'plan_activated_at' => now()->subHours(2),
    ]);
    User::factory()->create([
        'business_id' => $b->id,
        'stripe_id' => 'cus_pendr_'.uniqid('', true),
    ]);

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    expect(ProDriftAlert::open()->where('business_id', $b->id)->count())->toBe(0);
});

it('Pending con plan_activated_at antiguo y sin suscripción genera pending_stale', function () {
    Mail::fake();
    $b = Business::create([
        'name' => 'Pending Stale',
        'subdomain' => 'pend-s-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pending',
        'plan_activated_at' => now()->subDays(30),
    ]);
    User::factory()->create([
        'business_id' => $b->id,
        'stripe_id' => 'cus_pends_'.uniqid('', true),
    ]);

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    $alert = ProDriftAlert::open()->where('business_id', $b->id)->first();
    expect($alert)->not->toBeNull()
        ->and($alert->drift_type)->toBe('pending_stale');
});

it('si hay drifts y PRO_AUDIT_ALERT_EMAIL está configurado, encola el email', function () {
    Mail::fake();
    config(['pro_subscriptions.audit.alert_email' => 'ops@onez.test']);
    [$b, $u] = makeProBusinessWithStripeButNoSubscription();

    Artisan::call('app:audit-pro-subscriptions');

    Mail::assertQueued(ProSubscriptionDriftAlert::class, function ($mail) {
        return $mail->hasTo('ops@onez.test') && $mail->totalDrifts === 1;
    });
});

it('si no hay drifts, NO encola el email aunque haya destinatario configurado', function () {
    Mail::fake();
    config(['pro_subscriptions.audit.alert_email' => 'ops@onez.test']);
    [$b, $u] = makeProBusinessWithActiveSubscription();

    Artisan::call('app:audit-pro-subscriptions');

    Mail::assertNothingQueued();
});

// [ESCALA] Verifica que con muchas cuentas Pro la auditoría no dispara una query por usuario.
// 30 negocios + eager load de owner + subscriptions ⇒ ~5 queries totales, NO ~60.
it('audita N negocios sin disparar N+1 queries (eager load funciona)', function () {
    Mail::fake();

    for ($i = 0; $i < 30; $i++) {
        $b = Business::create([
            'name' => "Bulk Pro {$i}",
            'subdomain' => 'bulk-pro-'.$i.'-'.uniqid('', true),
            'subdomain_type' => 'random',
            'sector' => 'otros',
            'plan' => 'pro',
        ]);
        $u = User::factory()->create([
            'business_id' => $b->id,
            'stripe_id' => 'cus_bulk_'.$i.'_'.uniqid('', true),
        ]);
        $u->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_bulk_'.$i.'_'.uniqid('', true),
            'stripe_status' => 'active',
            'stripe_price' => 'price_pro_test',
            'quantity' => 1,
        ]);
    }

    DB::enableQueryLog();
    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);
    $queries = count(DB::getQueryLog());
    DB::disableQueryLog();

    // Sin eager load serían >60 queries (1 por subscribed() por cada uno de los 30 negocios).
    // Con eager load son ~5 queries de auditoría (negocios pro, owners, subscriptions, negocios free, owners free).
    // Margen amplio para queries auxiliares del framework: < 25.
    expect($queries)->toBeLessThan(25);

    // Y todos los negocios deben estar OK (sin alertas).
    expect(ProDriftAlert::open()->count())->toBe(0);
});

// [ESCALA] Verifica truncado del email a max displayed.
it('si hay más drifts que email_max_displayed, el Mailable recibe sólo los primeros', function () {
    Mail::fake();
    config([
        'pro_subscriptions.audit.alert_email' => 'ops@onez.test',
        'pro_subscriptions.audit.email_max_displayed' => 3,
    ]);

    for ($i = 0; $i < 5; $i++) {
        [$b, $u] = makeProBusinessWithStripeButNoSubscription();
    }

    Artisan::call('app:audit-pro-subscriptions');

    Mail::assertQueued(ProSubscriptionDriftAlert::class, function ($mail) {
        return $mail->totalDrifts === 5
            && count($mail->drifts) === 3;
    });
});

// [ESCALA] Verifica que --prune-resolved-days borra alertas resueltas viejas.
it('--prune-resolved-days borra alertas resueltas hace más de N días', function () {
    Mail::fake();

    $b = Business::create([
        'name' => 'Old Drift',
        'subdomain' => 'old-drift-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);

    // Alerta antigua resuelta hace 200 días: debe borrarse.
    ProDriftAlert::create([
        'business_id' => $b->id,
        'user_id' => null,
        'stripe_customer_id' => null,
        'plan_value' => 'free',
        'drift_type' => 'pro_without_subscription',
        'subscription_status' => 'canceled',
        'detected_at' => now()->subDays(220),
        'resolved_at' => now()->subDays(200),
        'notes' => 'old resolved',
    ]);
    // Alerta resuelta hace 30 días: NO debe borrarse.
    ProDriftAlert::create([
        'business_id' => $b->id,
        'user_id' => null,
        'stripe_customer_id' => null,
        'plan_value' => 'free',
        'drift_type' => 'pro_without_subscription',
        'subscription_status' => 'canceled',
        'detected_at' => now()->subDays(60),
        'resolved_at' => now()->subDays(30),
        'notes' => 'recent resolved',
    ]);

    Artisan::call('app:audit-pro-subscriptions', [
        '--no-mail' => true,
        '--prune-resolved-days' => 180,
    ]);

    expect(ProDriftAlert::where('notes', 'old resolved')->count())->toBe(0)
        ->and(ProDriftAlert::where('notes', 'recent resolved')->count())->toBe(1);
});

// [ESCALA] Verifica que la poda con valor 0 (default) NO borra nada.
it('sin --prune-resolved-days (o 0) las alertas resueltas viejas se conservan', function () {
    Mail::fake();

    $b = Business::create([
        'name' => 'Keep Old',
        'subdomain' => 'keep-old-'.uniqid('', true),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);

    ProDriftAlert::create([
        'business_id' => $b->id,
        'user_id' => null,
        'stripe_customer_id' => null,
        'plan_value' => 'free',
        'drift_type' => 'pro_without_subscription',
        'subscription_status' => 'canceled',
        'detected_at' => now()->subDays(500),
        'resolved_at' => now()->subDays(400),
        'notes' => 'very old resolved',
    ]);

    Artisan::call('app:audit-pro-subscriptions', ['--no-mail' => true]);

    expect(ProDriftAlert::where('notes', 'very old resolved')->count())->toBe(1);
});
