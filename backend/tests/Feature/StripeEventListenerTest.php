<?php

use App\Listeners\StripeEventListener;
use App\Mail\WelcomeProOnez;
use App\Models\Business;
use App\Models\ProcessedStripeEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Cashier\Events\WebhookReceived;

uses(RefreshDatabase::class);

it('sets business plan to pro on checkout.session.completed without publishing', function () {
    Mail::fake();

    $business = Business::create([
        'name' => 'Checkout Biz',
        'subdomain' => 'chk-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => false,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    $listener = new StripeEventListener;
    $listener->handle(new WebhookReceived([
        'id' => 'evt_test_checkout_'.uniqid(),
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'business_id' => (string) $business->id,
                ],
                'payment_status' => 'paid',
            ],
        ],
    ]));

    $business->refresh();

    expect($business->plan->value)->toBe('pro')
        ->and($business->is_published)->toBeFalse();
});

it('sends WelcomeProOnez email after a successful checkout', function () {
    Mail::fake();

    $business = Business::create([
        'name' => 'Café Lila',
        'subdomain' => 'lila-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'restauracion',
        'plan' => 'free',
        'is_published' => false,
    ]);
    $user = User::factory()->create([
        'business_id' => $business->id,
        'name' => 'Brayan',
        'email' => 'welcome-pro@onez.test',
    ]);

    $listener = new StripeEventListener;
    $listener->handle(new WebhookReceived([
        'id' => 'evt_test_welcome_'.uniqid(),
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'business_id' => (string) $business->id,
                ],
                'payment_status' => 'paid',
                'amount_total' => 899,
                'currency' => 'eur',
            ],
        ],
    ]));

    Mail::assertSent(WelcomeProOnez::class, function (WelcomeProOnez $mail) use ($user, $business) {
        return $mail->hasTo($user->email)
            && $mail->name === 'Brayan'
            && $mail->businessName === $business->name
            && $mail->price === '8,99'
            && $mail->cycle === 'Mensual'
            && str_contains($mail->dashboardUrl, '/dashboard');
    });
});

it('does not send WelcomeProOnez when the business_id metadata is invalid', function () {
    Mail::fake();

    $listener = new StripeEventListener;
    $listener->handle(new WebhookReceived([
        'id' => 'evt_test_no_business_'.uniqid(),
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => '999999',
                    'business_id' => '999999',
                ],
                'payment_status' => 'paid',
            ],
        ],
    ]));

    Mail::assertNotSent(WelcomeProOnez::class);
});

it('downgrades plan to free on customer.subscription.deleted', function () {
    $business = Business::create([
        'name' => 'Sub Biz',
        'subdomain' => 'sub-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
        'plan_activated_at' => now(),
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => 'cus_test_deleted'])->save();

    $listener = new StripeEventListener;
    $listener->handle(new WebhookReceived([
        'id' => 'evt_test_sub_deleted_'.uniqid(),
        'type' => 'customer.subscription.deleted',
        'data' => [
            'object' => [
                'customer' => 'cus_test_deleted',
            ],
        ],
    ]));

    $business->refresh();

    expect($business->plan->value)->toBe('free')
        ->and($business->plan_activated_at)->toBeNull();
});

it('does not throw for an unknown Stripe event type', function () {
    $listener = new StripeEventListener;

    expect(fn () => $listener->handle(new WebhookReceived([
        'id' => 'evt_test_unknown_'.uniqid(),
        'type' => 'unknown.event.type',
        'data' => ['object' => []],
    ])))->not->toThrow(Throwable::class);
});

it('skips duplicate Stripe events with the same event_id', function () {
    $business = Business::create([
        'name' => 'Idem Biz',
        'subdomain' => 'idem-aabb-ccdd',
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
        'is_published' => false,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    $eventId = 'evt_test_idempotent_'.uniqid();
    $payload = [
        'id' => $eventId,
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'business_id' => (string) $business->id,
                    'subdomain' => 'changed-subdomain',
                ],
                'payment_status' => 'paid',
            ],
        ],
    ];

    $listener = new StripeEventListener;
    $listener->handle(new WebhookReceived($payload));

    $business->refresh();
    $firstUpdatedAt = (string) $business->updated_at;
    expect($business->plan->value)->toBe('pro')
        ->and($business->is_published)->toBeFalse()
        ->and($business->subdomain)->toBe('changed-subdomain');

    // Avanzamos el reloj para detectar cualquier UPDATE silencioso al reprocesar.
    Carbon\Carbon::setTestNow(now()->addSeconds(5));

    $listener->handle(new WebhookReceived($payload));

    expect(ProcessedStripeEvent::query()->where('event_id', $eventId)->count())->toBe(1);

    $business->refresh();
    expect((string) $business->updated_at)->toBe($firstUpdatedAt);

    Carbon\Carbon::setTestNow();
});

it('removes the processed marker if handler throws so Stripe can retry', function () {
    $eventId = 'evt_test_retry_'.uniqid();
    $payload = [
        'id' => $eventId,
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'metadata' => [
                    'user_id' => '999999',
                    'business_id' => '999999',
                ],
            ],
        ],
    ];

    // Forzamos un fallo durante el handler simulando que el modelo Business lanza.
    $listener = new class extends StripeEventListener
    {
        protected function handleCheckoutCompleted(array $object): void
        {
            throw new RuntimeException('boom');
        }
    };

    expect(fn () => $listener->handle(new WebhookReceived($payload)))
        ->toThrow(RuntimeException::class, 'boom');

    expect(ProcessedStripeEvent::query()->where('event_id', $eventId)->exists())->toBeFalse();
});

it('ignores Stripe payloads without an event id', function () {
    $before = ProcessedStripeEvent::query()->count();
    $listener = new StripeEventListener;

    $listener->handle(new WebhookReceived([
        'type' => 'checkout.session.completed',
        'data' => ['object' => []],
    ]));

    expect(ProcessedStripeEvent::query()->count())->toBe($before);
});

/**
 * Helper para preparar un usuario con stripe_id y un negocio en un estado dado.
 */
function makeBillingPair(array $businessAttrs = [], string $stripeCustomerId = 'cus_test_subupd'): array
{
    $business = Business::create(array_merge([
        'name' => 'Sub Upd Biz',
        'subdomain' => 'sub-upd-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ], $businessAttrs));

    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => $stripeCustomerId])->save();

    return [$business, $user];
}

it('downgrades to free on customer.subscription.updated active → canceled', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => now()->subDay(),
    ], 'cus_test_canceled');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_sub_upd_canceled_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_canceled',
                'status' => 'canceled',
                'previous_attributes' => ['status' => 'active'],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('free')
        ->and($business->plan_activated_at)->toBeNull();
});

it('keeps plan and logs warning on customer.subscription.updated active → past_due', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => now()->subDays(2),
    ], 'cus_test_pastdue');

    $activatedBefore = (string) $business->plan_activated_at;

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_sub_upd_pastdue_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_pastdue',
                'status' => 'past_due',
                'previous_attributes' => ['status' => 'active'],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('pro')
        ->and((string) $business->plan_activated_at)->toBe($activatedBefore);
});

it('keeps plan_activated_at when recovering past_due → active', function () {
    $original = now()->subDays(10)->startOfSecond();

    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => $original,
    ], 'cus_test_recover');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_sub_upd_recover_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_recover',
                'status' => 'active',
                'previous_attributes' => ['status' => 'past_due'],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('pro')
        ->and($business->plan_activated_at?->toIso8601String())->toBe($original->toIso8601String());
});

it('promotes to pro on customer.subscription.updated incomplete → active', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'free',
        'plan_activated_at' => null,
    ], 'cus_test_incomplete_active');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_sub_upd_incomplete_active_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_incomplete_active',
                'status' => 'active',
                'previous_attributes' => ['status' => 'incomplete'],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('pro')
        ->and($business->plan_activated_at)->not->toBeNull();
});

it('promotes to pro on customer.subscription.updated trialing → active and preserves plan_activated_at', function () {
    $original = now()->subDays(7)->startOfSecond();

    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => $original,
    ], 'cus_test_trialing_active');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_sub_upd_trial_active_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_trialing_active',
                'status' => 'active',
                'previous_attributes' => ['status' => 'trialing'],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('pro')
        ->and($business->plan_activated_at?->toIso8601String())->toBe($original->toIso8601String());
});

it('downgrades to free on customer.subscription.updated incomplete → incomplete_expired', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'free',
        'plan_activated_at' => null,
    ], 'cus_test_incomplete_expired');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_sub_upd_incomplete_expired_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_incomplete_expired',
                'status' => 'incomplete_expired',
                'previous_attributes' => ['status' => 'incomplete'],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('free')
        ->and($business->plan_activated_at)->toBeNull();
});

it('downgrades on unpaid (Stripe gives up after grace period)', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => now()->subDays(3),
    ], 'cus_test_unpaid');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_sub_upd_unpaid_'.uniqid(),
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_unpaid',
                'status' => 'unpaid',
                'previous_attributes' => ['status' => 'past_due'],
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('free')
        ->and($business->plan_activated_at)->toBeNull();
});

it('does not change the plan on invoice.payment_failed', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => now()->subDay(),
    ], 'cus_test_inv_failed');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_invoice_failed_'.uniqid(),
        'type' => 'invoice.payment_failed',
        'data' => [
            'object' => [
                'id' => 'in_test_failed',
                'customer' => 'cus_test_inv_failed',
                'attempt_count' => 1,
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('pro');
});

it('handles customer.subscription.trial_will_end without changing the plan', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => now()->subDay(),
    ], 'cus_test_trial_will_end');

    (new StripeEventListener)->handle(new WebhookReceived([
        'id' => 'evt_test_trial_will_end_'.uniqid(),
        'type' => 'customer.subscription.trial_will_end',
        'data' => [
            'object' => [
                'id' => 'sub_test_trial',
                'customer' => 'cus_test_trial_will_end',
                'trial_end' => now()->addDays(3)->timestamp,
            ],
        ],
    ]));

    $business->refresh();
    expect($business->plan->value)->toBe('pro');
});

it('subscription.updated handlers are idempotent across duplicate events', function () {
    [$business, $user] = makeBillingPair([
        'plan' => 'pro',
        'plan_activated_at' => now()->subDay(),
    ], 'cus_test_idem_subupd');

    $eventId = 'evt_test_subupd_idem_'.uniqid();
    $payload = [
        'id' => $eventId,
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'customer' => 'cus_test_idem_subupd',
                'status' => 'canceled',
                'previous_attributes' => ['status' => 'active'],
            ],
        ],
    ];

    $listener = new StripeEventListener;
    $listener->handle(new WebhookReceived($payload));
    $business->refresh();
    $firstUpdatedAt = (string) $business->updated_at;

    Carbon\Carbon::setTestNow(now()->addSeconds(5));
    $listener->handle(new WebhookReceived($payload));

    expect(ProcessedStripeEvent::query()->where('event_id', $eventId)->count())->toBe(1);

    $business->refresh();
    expect((string) $business->updated_at)->toBe($firstUpdatedAt)
        ->and($business->plan->value)->toBe('free');

    Carbon\Carbon::setTestNow();
});
