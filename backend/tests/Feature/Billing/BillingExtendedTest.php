<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Cashier\Subscription;
use Tests\TestCase;

uses(RefreshDatabase::class);

/**
 * Helpers locales del suite.
 *
 * Notas sobre el patrón:
 * - El proyecto NO tiene `BusinessFactory`, y la FK del owner vive en
 *   `users.business_id` (User belongsTo Business). Por eso creamos el
 *   negocio con `Business::create([...])` y enlazamos el FK en el usuario
 *   con `forceFill` (mismo patrón que `tests/Feature/Api/SubscriptionLifecycleTest.php`).
 * - `Laravel\Cashier\Subscription` declara `$guarded = []`, así que
 *   `Subscription::create([...])` con los campos definidos en la migración
 *   `2026_04_29_195427_create_subscriptions_table` (`user_id`, `type`,
 *   `stripe_id`, `stripe_status`, `stripe_price`, `quantity`, `ends_at`)
 *   funciona sin tocar Stripe.
 */
function makeUserWithStripe(): User
{
    $user = User::factory()->create();
    $user->forceFill(['stripe_id' => 'cus_test_'.uniqid()])->save();

    return $user;
}

function makeProUserWithSubscription(): User
{
    $user = makeUserWithStripe();

    $business = Business::create([
        'name' => 'Sub Pro',
        'subdomain' => 'sub-pro-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => Plan::Pro,
        'plan_activated_at' => now(),
        'is_published' => true,
    ]);
    $user->forceFill(['business_id' => $business->id])->save();

    Subscription::create([
        'user_id' => $user->id,
        'type' => 'default',
        'stripe_id' => 'sub_test_'.uniqid(),
        'stripe_status' => 'active',
        'stripe_price' => 'price_test',
        'quantity' => 1,
        'ends_at' => null,
    ]);

    return $user;
}

// ─── invoices ──────────────────────────────────────────────────

it('devuelve lista vacía de facturas cuando el usuario no tiene stripe_id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/v1/billing/invoices');

    $response->assertOk()->assertJsonPath('data.invoices', []);
});

it('devuelve facturas fixture cuando el usuario tiene stripe_id (testing)', function () {
    /** @var TestCase $this */
    $user = makeUserWithStripe();

    $response = $this->actingAs($user)->getJson('/api/v1/billing/invoices');

    $response->assertOk()
        ->assertJsonCount(2, 'data.invoices')
        ->assertJsonPath('data.invoices.0.number', 'INV-0001')
        ->assertJsonPath('data.invoices.0.status', 'paid')
        ->assertJsonPath('data.invoices.0.currency', 'EUR');
});

it('rechaza listado de facturas sin autenticar', function () {
    /** @var TestCase $this */
    $this->getJson('/api/v1/billing/invoices')->assertUnauthorized();
});

// ─── descarga de factura ───────────────────────────────────────

it('devuelve PDF de factura en testing', function () {
    /** @var TestCase $this */
    $user = makeUserWithStripe();

    $response = $this->actingAs($user)
        ->get('/api/v1/billing/invoices/in_test_001/download');

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('application/pdf');
});

it('devuelve 404 al descargar factura cuando no hay stripe_id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/api/v1/billing/invoices/in_xxx/download')
        ->assertNotFound();
});

it('rechaza descarga de factura sin autenticar', function () {
    /** @var TestCase $this */
    $this->get('/api/v1/billing/invoices/in_xxx/download')->assertUnauthorized();
});

// ─── método de pago ────────────────────────────────────────────

it('devuelve null cuando no hay stripe_id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/billing/payment-method')
        ->assertOk()
        ->assertJsonPath('data.payment_method', null);
});

it('devuelve método de pago fixture en testing con stripe_id', function () {
    /** @var TestCase $this */
    $user = makeUserWithStripe();

    $response = $this->actingAs($user)->getJson('/api/v1/billing/payment-method');

    $response->assertOk()
        ->assertJsonPath('data.payment_method.brand', 'visa')
        ->assertJsonPath('data.payment_method.last4', '4242')
        ->assertJsonPath('data.payment_method.exp_month', 12)
        ->assertJsonPath('data.payment_method.exp_year', 2030);
});

// ─── upcoming ──────────────────────────────────────────────────

it('devuelve null upcoming cuando no hay suscripción', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/billing/upcoming')
        ->assertOk()
        ->assertJsonPath('data.upcoming', null);
});

it('devuelve upcoming fixture con suscripción activa', function () {
    /** @var TestCase $this */
    $user = makeProUserWithSubscription();

    $response = $this->actingAs($user)->getJson('/api/v1/billing/upcoming');

    $response->assertOk()
        ->assertJsonPath('data.upcoming.total', 999)
        ->assertJsonPath('data.upcoming.currency', 'EUR');
});

// ─── cancel ────────────────────────────────────────────────────

it('cancela suscripción activa marcándola para fin de periodo', function () {
    /** @var TestCase $this */
    $user = makeProUserWithSubscription();

    $response = $this->actingAs($user)->postJson('/api/v1/billing/cancel');

    $response->assertOk()
        ->assertJsonPath('data.message', 'Suscripción cancelada al final del periodo');

    expect($user->subscription('default')->fresh()->ends_at)->not->toBeNull();
});

it('rechaza cancelación si no hay suscripción', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/billing/cancel')
        ->assertStatus(422);
});

it('rechaza cancelación si la suscripción ya está marcada para cancelar', function () {
    /** @var TestCase $this */
    $user = makeProUserWithSubscription();
    $user->subscription('default')->forceFill(['ends_at' => now()->addMonth()])->save();

    $this->actingAs($user)
        ->postJson('/api/v1/billing/cancel')
        ->assertStatus(422);
});

it('rechaza cancelación sin autenticar', function () {
    /** @var TestCase $this */
    $this->postJson('/api/v1/billing/cancel')->assertUnauthorized();
});

// ─── resume ────────────────────────────────────────────────────

it('reanuda suscripción cancelada', function () {
    /** @var TestCase $this */
    $user = makeProUserWithSubscription();
    $user->subscription('default')->forceFill(['ends_at' => now()->addMonth()])->save();

    $response = $this->actingAs($user)->postJson('/api/v1/billing/resume');

    $response->assertOk()->assertJsonPath('data.message', 'Suscripción reanudada');
    expect($user->subscription('default')->fresh()->ends_at)->toBeNull();
});

it('rechaza resume si no hay suscripción', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/billing/resume')
        ->assertStatus(422);
});

it('rechaza resume si la suscripción no está cancelada', function () {
    /** @var TestCase $this */
    $user = makeProUserWithSubscription();

    $this->actingAs($user)
        ->postJson('/api/v1/billing/resume')
        ->assertStatus(422);
});

it('rechaza resume sin autenticar', function () {
    /** @var TestCase $this */
    $this->postJson('/api/v1/billing/resume')->assertUnauthorized();
});
