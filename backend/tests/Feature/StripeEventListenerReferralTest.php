<?php

use App\Listeners\StripeEventListener;
use App\Mail\ReferrerReachedTemplateGift;
use App\Models\Business;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Laravel\Cashier\Events\WebhookReceived;
use Laravel\Cashier\Subscription;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'referrals.reward_coupon_id' => 'coupon_referrer_reward_test',
        'referrals.template_gift_at' => 5,
        'referrals.admin_notify_email' => 'admin@onez.test',
    ]);
});

/**
 * @return array<string, mixed>
 */
function invoicePaymentSucceededPayload(
    string $customerId,
    string $invoiceId,
    int $amountPaid,
    ?string $eventId = null,
): array {
    return [
        'id' => $eventId ?? 'evt_inv_'.uniqid(),
        'type' => 'invoice.payment_succeeded',
        'data' => [
            'object' => [
                'id' => $invoiceId,
                'customer' => $customerId,
                'amount_paid' => $amountPaid,
            ],
        ],
    ];
}

function makeReferredUserWithStripe(string $stripeCustomerId = 'cus_referred'): User
{
    $business = Business::create([
        'name' => 'Referred Biz',
        'subdomain' => 'ref-pay-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'free',
    ]);

    $user = User::factory()->create(['business_id' => $business->id]);
    $user->forceFill(['stripe_id' => $stripeCustomerId])->save();

    return $user;
}

function invokeMaybeRewardReferrer(User $referrer, Referral $referral): void
{
    $method = new ReflectionMethod(StripeEventListener::class, 'maybeRewardReferrer');
    $method->invoke(new StripeEventListener, $referrer, $referral);
}

function makeReferrerWithActiveSubscription(): User
{
    $business = Business::create([
        'name' => 'Referrer Biz',
        'subdomain' => 'ref-rr-'.uniqid(),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => 'pro',
    ]);

    $referrer = User::factory()->create(['business_id' => $business->id]);
    $referrer->forceFill(['stripe_id' => 'cus_referrer_'.uniqid()])->save();

    Subscription::create([
        'user_id' => $referrer->id,
        'type' => 'default',
        'stripe_id' => 'sub_referrer_'.uniqid(),
        'stripe_status' => 'active',
        'stripe_price' => 'price_test',
        'quantity' => 1,
    ]);

    return $referrer;
}

it('does nothing on invoice.payment_succeeded when amount_paid is zero', function () {
    $referred = makeReferredUserWithStripe();
    $referrer = makeReferrerWithActiveSubscription();

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    (new StripeEventListener)->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred', 'in_zero_amount', 0),
    ));

    $referral->refresh();

    expect($referral->status)->toBe(Referral::STATUS_REGISTERED)
        ->and($referral->stripe_invoice_id)->toBeNull();
});

it('does nothing when the customer has no registered referral', function () {
    $referred = makeReferredUserWithStripe('cus_no_referral');

    (new StripeEventListener)->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_no_referral', 'in_no_referral', 899),
    ));

    expect(Referral::query()->count())->toBe(0);
});

it('marks referral as paid and rewards referrer when coupon is configured', function () {
    Mail::fake();

    $referrer = makeReferrerWithActiveSubscription();
    $referred = makeReferredUserWithStripe('cus_referred_paid');

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    $subscription = $referrer->subscription('default');
    $subscriptionMock = Mockery::mock($subscription)->makePartial();
    $subscriptionMock->shouldReceive('updateStripeSubscription')
        ->once()
        ->with(['discounts' => [['coupon' => 'coupon_referrer_reward_test']]])
        ->andReturn(new stdClass);

    $referrerMock = Mockery::mock($referrer)->makePartial();
    $referrerMock->shouldReceive('subscription')->with('default')->andReturn($subscriptionMock);

    $listener = Mockery::mock(StripeEventListener::class)->makePartial()->shouldAllowMockingProtectedMethods();
    $listener->shouldReceive('maybeRewardReferrer')
        ->once()
        ->with(
            Mockery::on(fn (User $user) => $user->id === $referrer->id),
            Mockery::on(fn (Referral $model) => $model->id === $referral->id && $model->status === Referral::STATUS_PAID),
        )
        ->andReturnUsing(function (User $rewardReferrer, Referral $paidReferral) use ($referrerMock) {
            invokeMaybeRewardReferrer($referrerMock, $paidReferral);
        });

    $listener->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred_paid', 'in_first_payment', 899),
    ));

    $referral->refresh();

    expect($referral->status)->toBe(Referral::STATUS_REWARDED)
        ->and($referral->stripe_invoice_id)->toBe('in_first_payment')
        ->and($referral->first_payment_at)->not->toBeNull()
        ->and($referral->rewarded_at)->not->toBeNull();

    Mail::assertNotSent(ReferrerReachedTemplateGift::class);
});

it('keeps referral as paid when reward coupon is not configured', function () {
    config(['referrals.reward_coupon_id' => null]);
    Event::fake([MessageLogged::class]);

    $referrer = makeReferrerWithActiveSubscription();
    $referred = makeReferredUserWithStripe('cus_referred_no_coupon');

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    (new StripeEventListener)->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred_no_coupon', 'in_no_coupon_cfg', 899),
    ));

    $referral->refresh();

    expect($referral->status)->toBe(Referral::STATUS_PAID)
        ->and($referral->rewarded_at)->toBeNull();

    Event::assertDispatched(MessageLogged::class, fn (MessageLogged $event) => $event->level === 'error'
        && $event->message === 'STRIPE_COUPON_REFERRER_REWARD not configured');
});

it('skips duplicate processing for the same stripe invoice id', function () {
    $referrer = makeReferrerWithActiveSubscription();
    $referred = makeReferredUserWithStripe('cus_referred_dup');

    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_PAID,
        'first_payment_at' => now()->subDay(),
        'stripe_invoice_id' => 'in_already_processed',
    ]);

    (new StripeEventListener)->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred_dup', 'in_already_processed', 899),
    ));

    $referredReferral = Referral::query()
        ->where('referred_user_id', $referred->id)
        ->first();

    expect($referredReferral?->status)->toBe(Referral::STATUS_PAID)
        ->and(Referral::query()->where('stripe_invoice_id', 'in_already_processed')->count())->toBe(1);
});

it('sends admin mail when paid or rewarded count reaches template_gift_at exactly', function () {
    Mail::fake();

    $referrer = makeReferrerWithActiveSubscription();
    $referred = makeReferredUserWithStripe('cus_referred_gift5');

    foreach (range(1, 4) as $i) {
        $other = User::factory()->create(['email' => "prior-ref-{$i}@example.com"]);
        Referral::create([
            'referrer_user_id' => $referrer->id,
            'referred_user_id' => $other->id,
            'referred_email' => $other->email,
            'status' => Referral::STATUS_REWARDED,
            'rewarded_at' => now()->subDays($i),
        ]);
    }

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    $subscription = $referrer->subscription('default');
    $subscriptionMock = Mockery::mock($subscription)->makePartial();
    $subscriptionMock->shouldReceive('updateStripeSubscription')->once()->andReturn(new stdClass);

    $referrerMock = Mockery::mock($referrer)->makePartial();
    $referrerMock->shouldReceive('subscription')->with('default')->andReturn($subscriptionMock);

    $listener = Mockery::mock(StripeEventListener::class)->makePartial()->shouldAllowMockingProtectedMethods();
    $listener->shouldReceive('maybeRewardReferrer')
        ->once()
        ->andReturnUsing(fn (User $r, Referral $ref) => invokeMaybeRewardReferrer($referrerMock, $ref));

    $listener->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred_gift5', 'in_gift_threshold', 899),
    ));

    Mail::assertSent(ReferrerReachedTemplateGift::class, function (ReferrerReachedTemplateGift $mail) use ($referrer) {
        return $mail->hasTo('admin@onez.test')
            && $mail->referrerName === $referrer->name
            && $mail->referrerEmail === $referrer->email
            && $mail->count === 5;
    });

    expect($referral->fresh()->status)->toBe(Referral::STATUS_REWARDED);
});

it('does not send admin mail when count is below template_gift_at', function () {
    Mail::fake();

    $referrer = makeReferrerWithActiveSubscription();
    $referred = makeReferredUserWithStripe('cus_referred_below');

    Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => User::factory()->create()->id,
        'referred_email' => 'below@example.com',
        'status' => Referral::STATUS_PAID,
    ]);

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    $subscriptionMock = Mockery::mock($referrer->subscription('default'))->makePartial();
    $subscriptionMock->shouldReceive('updateStripeSubscription')->once()->andReturn(new stdClass);
    $referrerMock = Mockery::mock($referrer)->makePartial();
    $referrerMock->shouldReceive('subscription')->with('default')->andReturn($subscriptionMock);

    $listener = Mockery::mock(StripeEventListener::class)->makePartial()->shouldAllowMockingProtectedMethods();
    $listener->shouldReceive('maybeRewardReferrer')
        ->once()
        ->andReturnUsing(fn (User $r, Referral $ref) => invokeMaybeRewardReferrer($referrerMock, $ref));

    $listener->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred_below', 'in_below_threshold', 899),
    ));

    Mail::assertNotSent(ReferrerReachedTemplateGift::class);
    expect($referral->fresh()->status)->toBe(Referral::STATUS_REWARDED);
});

it('does not send admin mail when count is above template_gift_at', function () {
    Mail::fake();

    $referrer = makeReferrerWithActiveSubscription();
    $referred = makeReferredUserWithStripe('cus_referred_above');

    foreach (range(1, 5) as $i) {
        $other = User::factory()->create(['email' => "above-ref-{$i}@example.com"]);
        Referral::create([
            'referrer_user_id' => $referrer->id,
            'referred_user_id' => $other->id,
            'referred_email' => $other->email,
            'status' => Referral::STATUS_REWARDED,
        ]);
    }

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    $subscriptionMock = Mockery::mock($referrer->subscription('default'))->makePartial();
    $subscriptionMock->shouldReceive('updateStripeSubscription')->once()->andReturn(new stdClass);
    $referrerMock = Mockery::mock($referrer)->makePartial();
    $referrerMock->shouldReceive('subscription')->with('default')->andReturn($subscriptionMock);

    $listener = Mockery::mock(StripeEventListener::class)->makePartial()->shouldAllowMockingProtectedMethods();
    $listener->shouldReceive('maybeRewardReferrer')
        ->once()
        ->andReturnUsing(fn (User $r, Referral $ref) => invokeMaybeRewardReferrer($referrerMock, $ref));

    $listener->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred_above', 'in_above_threshold', 899),
    ));

    Mail::assertNotSent(ReferrerReachedTemplateGift::class);
    expect($referral->fresh()->status)->toBe(Referral::STATUS_REWARDED);
});

it('keeps referral as paid when referrer has no active subscription', function () {
    Event::fake([MessageLogged::class]);

    $referrer = User::factory()->create();
    $referred = makeReferredUserWithStripe('cus_referred_no_sub');

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => $referred->id,
        'referred_email' => $referred->email,
        'status' => Referral::STATUS_REGISTERED,
    ]);

    (new StripeEventListener)->handle(new WebhookReceived(
        invoicePaymentSucceededPayload('cus_referred_no_sub', 'in_no_sub_referrer', 899),
    ));

    $referral->refresh();

    expect($referral->status)->toBe(Referral::STATUS_PAID)
        ->and($referral->rewarded_at)->toBeNull();

    Event::assertDispatched(MessageLogged::class, fn (MessageLogged $event) => $event->level === 'warning'
        && $event->message === 'Referrer has no active subscription, cannot apply reward');
});

it('applies reward coupon via updateStripeSubscription on maybeRewardReferrer', function () {
    $referrer = makeReferrerWithActiveSubscription();

    $referral = Referral::create([
        'referrer_user_id' => $referrer->id,
        'referred_user_id' => User::factory()->create()->id,
        'referred_email' => 'unit@example.com',
        'status' => Referral::STATUS_PAID,
        'first_payment_at' => now(),
        'stripe_invoice_id' => 'in_unit_reward',
    ]);

    $subscriptionMock = Mockery::mock($referrer->subscription('default'))->makePartial();
    $subscriptionMock->shouldReceive('updateStripeSubscription')
        ->once()
        ->with(['discounts' => [['coupon' => 'coupon_referrer_reward_test']]])
        ->andReturn(new stdClass);

    $referrerMock = Mockery::mock($referrer)->makePartial();
    $referrerMock->shouldReceive('subscribed')->with('default')->andReturn(true);
    $referrerMock->shouldReceive('subscription')->with('default')->andReturn($subscriptionMock);

    $method = new ReflectionMethod(StripeEventListener::class, 'maybeRewardReferrer');
    $method->invoke(new StripeEventListener, $referrerMock, $referral);

    expect($referral->fresh()->status)->toBe(Referral::STATUS_REWARDED)
        ->and($referral->fresh()->rewarded_at)->not->toBeNull();
});

afterEach(function () {
    Mockery::close();
});
