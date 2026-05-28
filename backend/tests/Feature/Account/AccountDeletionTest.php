<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\SecurityEvent;
use App\Models\User;
use App\Notifications\AccountDeletedEs;
use App\Services\AccountDeletionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Cashier\Subscription;
use Tests\TestCase;

uses(RefreshDatabase::class);

function makeDeletableUser(string $password = 'miPassword1'): User
{
    $user = User::factory()->create([
        'email' => 'delete-me@example.com',
        'password' => Hash::make($password),
    ]);

    $business = Business::create([
        'name' => 'Negocio a borrar',
        'subdomain' => 'del-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => Plan::Free,
        'is_published' => true,
    ]);
    $user->forceFill(['business_id' => $business->id])->save();

    return $user->fresh(['business']);
}

function makeDeletableProUser(string $password = 'miPassword1'): User
{
    $user = makeDeletableUser($password);
    $user->forceFill(['stripe_id' => 'cus_delete_'.uniqid()])->save();

    Subscription::create([
        'user_id' => $user->id,
        'type' => 'default',
        'stripe_id' => 'sub_delete_'.uniqid(),
        'stripe_status' => 'active',
        'stripe_price' => 'price_test',
        'quantity' => 1,
        'ends_at' => null,
    ]);

    $user->business->forceFill(['plan' => Plan::Pro])->save();

    return $user->fresh(['business']);
}

function insertUserSessionForDeletion(int $userId, string $sessionId): void
{
    DB::table('sessions')->insert([
        'id' => $sessionId,
        'user_id' => $userId,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'PHPUnit',
        'payload' => base64_encode(serialize([])),
        'last_activity' => now()->timestamp,
    ]);
}

it('elimina la cuenta con password y confirmación correctas', function () {
    /** @var TestCase $this */
    Notification::fake();
    $user = makeDeletableUser();
    $businessId = $user->business_id;
    insertUserSessionForDeletion($user->id, 'session-to-delete-aaaaaaaaaaaa');

    $response = $this->actingAs($user)->deleteJson('/api/v1/account', [
        'current_password' => 'miPassword1',
        'confirmation' => 'ELIMINAR',
    ]);

    $response->assertNoContent();

    $deleted = User::withTrashed()->find($user->id);
    expect($deleted)->not->toBeNull();
    expect($deleted->deleted_at)->not->toBeNull();
    expect($deleted->name)->toBe('Usuario eliminado');
    expect($deleted->email)->toBe(app(AccountDeletionService::class)->anonymizedEmail($user->id));
    expect($deleted->business_id)->toBeNull();
    expect(User::find($user->id))->toBeNull();

    $business = Business::find($businessId);
    expect($business)->not->toBeNull();
    expect($business->is_published)->toBeFalse();

    expect(DB::table('sessions')->where('user_id', $user->id)->count())->toBe(0);

    Notification::assertSentOnDemand(
        AccountDeletedEs::class,
        fn (AccountDeletedEs $notification, array $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'delete-me@example.com',
    );

    expect(
        SecurityEvent::query()
            ->where('user_id', $user->id)
            ->where('type', SecurityEvent::TYPE_ACCOUNT_DELETED)
            ->exists(),
    )->toBeTrue();
});

it('cancela suscripción activa antes de anonimizar la cuenta', function () {
    /** @var TestCase $this */
    Notification::fake();
    $user = makeDeletableProUser();

    $this->actingAs($user)->deleteJson('/api/v1/account', [
        'current_password' => 'miPassword1',
        'confirmation' => 'ELIMINAR',
    ])->assertNoContent();

    $subscription = Subscription::query()->where('user_id', $user->id)->first();
    expect($subscription)->not->toBeNull();
    expect($subscription->stripe_status)->toBe('canceled');
    expect($subscription->ends_at)->not->toBeNull();

    expect(User::withTrashed()->find($user->id)?->deleted_at)->not->toBeNull();
});

it('rechaza borrado con contraseña incorrecta', function () {
    /** @var TestCase $this */
    Notification::fake();
    $user = makeDeletableUser();

    $response = $this->actingAs($user)->deleteJson('/api/v1/account', [
        'current_password' => 'passwordIncorrecta',
        'confirmation' => 'ELIMINAR',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('current_password');
    expect(User::find($user->id)?->deleted_at)->toBeNull();
    Notification::assertNothingSent();
});

it('rechaza borrado si la confirmación no es ELIMINAR', function () {
    /** @var TestCase $this */
    Notification::fake();
    $user = makeDeletableUser();

    $response = $this->actingAs($user)->deleteJson('/api/v1/account', [
        'current_password' => 'miPassword1',
        'confirmation' => 'eliminar',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('confirmation');
    expect(User::find($user->id)?->deleted_at)->toBeNull();
    Notification::assertNothingSent();
});

it('aborta con 503 si falla la cancelación de Stripe y no anonimiza la cuenta', function () {
    /** @var TestCase $this */
    Notification::fake();
    $user = makeDeletableProUser();

    $this->mock(AccountDeletionService::class, function ($mock): void {
        $mock->shouldReceive('cancelStripeSubscription')
            ->once()
            ->andThrow(new RuntimeException('stripe down'));
        $mock->shouldNotReceive('anonymizeAndDelete');
    });

    $response = $this->actingAs($user)->deleteJson('/api/v1/account', [
        'current_password' => 'miPassword1',
        'confirmation' => 'ELIMINAR',
    ]);

    $response->assertStatus(503);
    expect(User::find($user->id)?->deleted_at)->toBeNull();
    expect(User::find($user->id)?->email)->toBe('delete-me@example.com');
    Notification::assertNothingSent();
});

it('rechaza borrado sin autenticar', function () {
    /** @var TestCase $this */
    $this->deleteJson('/api/v1/account', [
        'current_password' => 'miPassword1',
        'confirmation' => 'ELIMINAR',
    ])->assertUnauthorized();
});
