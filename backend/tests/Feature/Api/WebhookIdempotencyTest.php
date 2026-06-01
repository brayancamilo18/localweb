<?php

use App\Models\Business;
use App\Models\ProcessedStripeEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Cashier\Events\WebhookReceived;

uses(RefreshDatabase::class);

it('ignores duplicate checkout.session.completed with the same Stripe event id', function () {
    Storage::fake('local');
    Storage::fake('r2');

    $business = Business::create([
        'name' => 'Idempotency Biz',
        'subdomain' => 'idem-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'custom',
        'sector' => 'otros',
        'plan' => 'pending',
        'is_published' => false,
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);

    $payload = [
        'id' => 'evt_dup_checkout_same_id',
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
    ];

    event(new WebhookReceived($payload));

    $business->refresh();
    $firstUpdatedAt = $business->updated_at->copy();

    expect($business->plan->value)->toBe('pro')
        ->and($business->is_published)->toBeFalse();

    $r2CountAfterFirst = count(Storage::disk('r2')->allFiles());

    event(new WebhookReceived($payload));

    $business->refresh();

    expect($business->updated_at->equalTo($firstUpdatedAt))->toBeTrue()
        ->and(ProcessedStripeEvent::where('event_id', 'evt_dup_checkout_same_id')->count())->toBe(1);

    expect(count(Storage::disk('r2')->allFiles()))->toBe($r2CountAfterFirst);
});
