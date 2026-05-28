<?php

use App\Http\Controllers\Api\Account\ProfileController;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Models\SecurityEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

uses(RefreshDatabase::class);

function securityEventRequest(string $method, string $uri, array $server = []): Request
{
    return Request::create($uri, $method, [], [], [], array_merge([
        'REMOTE_ADDR' => '203.0.113.10',
        'HTTP_USER_AGENT' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0.0.0',
    ], $server));
}

function profilePasswordRequestForSecurity(User $user, array $payload): UpdatePasswordRequest
{
    $request = UpdatePasswordRequest::create('/api/v1/account/password', 'POST', $payload);
    $request->setContainer(app());
    $request->setRedirector(app('redirect'));
    $request->setUserResolver(fn () => $user);
    $request->validateResolved();

    return $request;
}

it('registra login exitoso con ip y user agent', function () {
    /** @var TestCase $this */
    $user = User::factory()->create([
        'email' => 'login-events@example.com',
        'password' => Hash::make('password123'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'login-events@example.com',
        'password' => 'password123',
    ], [
        'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0.0.0',
    ])->assertOk();

    $event = SecurityEvent::query()
        ->where('user_id', $user->id)
        ->where('type', SecurityEvent::TYPE_LOGIN)
        ->first();

    expect($event)->not->toBeNull();
    expect($event->ip_address)->not->toBeNull();
    expect($event->user_agent)->toContain('Chrome');
});

it('registra password_changed al cambiar contraseña', function () {
    /** @var TestCase $this */
    $user = User::factory()->create(['password' => Hash::make('viejaPassword1')]);

    $this->actingAs($user)->postJson('/api/v1/account/password', [
        'current_password' => 'viejaPassword1',
        'password' => 'nuevaPassword2',
        'password_confirmation' => 'nuevaPassword2',
    ], [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0) Firefox/121.0',
    ])->assertOk();

    $event = SecurityEvent::query()
        ->where('user_id', $user->id)
        ->where('type', SecurityEvent::TYPE_PASSWORD_CHANGED)
        ->first();

    expect($event)->not->toBeNull();
    expect($event->user_agent)->toContain('Firefox');
});

it('registra email_changed al cambiar email', function () {
    /** @var TestCase $this */
    $user = User::factory()->create([
        'email' => 'viejo@example.com',
        'password' => Hash::make('miPassword1'),
    ]);

    $this->actingAs($user)->patchJson('/api/v1/account/profile', [
        'email' => 'nuevo@example.com',
        'current_password' => 'miPassword1',
    ])->assertOk();

    expect(
        SecurityEvent::query()
            ->where('user_id', $user->id)
            ->where('type', SecurityEvent::TYPE_EMAIL_CHANGED)
            ->exists(),
    )->toBeTrue();
});

it('devuelve como máximo 20 eventos ordenados desc por created_at', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    for ($i = 0; $i < 25; $i++) {
        SecurityEvent::create([
            'user_id' => $user->id,
            'type' => SecurityEvent::TYPE_LOGIN,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'TestAgent',
            'created_at' => now()->subMinutes($i),
        ]);
    }

    $response = $this->actingAs($user)->getJson('/api/v1/account/security-events');

    $response->assertOk();
    $events = $response->json('data.events');

    expect($events)->toHaveCount(20);

    $timestamps = collect($events)->pluck('created_at')->all();
    expect($timestamps)->toBe(collect($timestamps)->sortDesc()->values()->all());
    expect($events[0]['user_agent_label'])->toBe('Navegador · SO desconocido');
});

it('no expone eventos de otros usuarios', function () {
    /** @var TestCase $this */
    $owner = User::factory()->create();
    $other = User::factory()->create();

    SecurityEvent::create([
        'user_id' => $other->id,
        'type' => SecurityEvent::TYPE_LOGIN,
        'ip_address' => '10.0.0.1',
        'user_agent' => 'Other',
    ]);

    SecurityEvent::create([
        'user_id' => $owner->id,
        'type' => SecurityEvent::TYPE_LOGIN,
        'ip_address' => '10.0.0.2',
        'user_agent' => 'Owner',
    ]);

    $response = $this->actingAs($owner)->getJson('/api/v1/account/security-events');

    $response->assertOk();
    expect($response->json('data.events'))->toHaveCount(1);
    expect($response->json('data.events.0.ip_address'))->toBe('10.0.0.2');
});

it('login persiste aunque falle el registro del evento', function () {
    /** @var TestCase $this */
    Log::spy();
    SecurityEvent::creating(function () {
        throw new RuntimeException('db fail');
    });

    User::factory()->create([
        'email' => 'login-resilient@example.com',
        'password' => Hash::make('password123'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'login-resilient@example.com',
        'password' => 'password123',
    ])->assertOk();

    expect(auth('web')->check())->toBeTrue();
    Log::shouldHaveReceived('error')->once();

    SecurityEvent::flushEventListeners();
});

it('cambio de contraseña persiste aunque falle el registro del evento', function () {
    /** @var TestCase $this */
    Log::spy();
    SecurityEvent::creating(function () {
        throw new RuntimeException('db fail');
    });

    $user = User::factory()->create(['password' => Hash::make('viejaPassword1')]);

    $response = app(ProfileController::class)->password(profilePasswordRequestForSecurity($user, [
        'current_password' => 'viejaPassword1',
        'password' => 'nuevaPassword2',
        'password_confirmation' => 'nuevaPassword2',
    ]));

    expect($response->getStatusCode())->toBe(200);
    expect(Hash::check('nuevaPassword2', $user->fresh()->password))->toBeTrue();
    Log::shouldHaveReceived('error')->once();

    SecurityEvent::flushEventListeners();
});

it('record captura ip y user agent de la request', function () {
    $user = User::factory()->create();
    $request = securityEventRequest('POST', '/api/v1/account/password');

    SecurityEvent::record($user, SecurityEvent::TYPE_PASSWORD_CHANGED, $request);

    $event = SecurityEvent::query()->where('user_id', $user->id)->first();

    expect($event?->ip_address)->toBe('203.0.113.10');
    expect($event?->user_agent)->toContain('Chrome');
});
