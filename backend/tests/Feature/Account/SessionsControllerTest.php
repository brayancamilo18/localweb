<?php

use App\Http\Controllers\Api\Account\SessionsController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['session.driver' => 'database']);
    app()->forgetInstance('session');
    app()->forgetInstance('session.store');
});

function insertUserSession(int $userId, string $id, array $overrides = []): void
{
    DB::table('sessions')->insert(array_merge([
        'id' => $id,
        'user_id' => $userId,
        'ip_address' => '203.0.113.10',
        'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'payload' => '',
        'last_activity' => now()->subHours(2)->timestamp,
    ], $overrides));
}

function sessionsCookieJarFromResponse($response): array
{
    return collect($response->baseResponse->headers->getCookies())
        ->mapWithKeys(fn (Cookie $c) => [$c->getName() => $c->getValue()])
        ->all();
}

function sessionStatefulHeaders(): array
{
    return [
        'Origin' => 'http://localhost:5173',
        'Referer' => 'http://localhost:5173/',
    ];
}

function sessionsRequestWithId(User $user, string $sessionId): Request
{
    $session = Mockery::mock(Store::class);
    $session->shouldReceive('getId')->andReturn($sessionId);

    $request = Request::create('/api/v1/account/sessions', 'GET');
    $request->setLaravelSession($session);
    $request->setUserResolver(fn () => $user);

    return $request;
}

it('lists sessions with is_current=true for the current session id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    $currentSessionId = 'current-session-id-for-is-current-test-01';

    insertUserSession($user->id, $currentSessionId, [
        'last_activity' => now()->timestamp,
    ]);
    insertUserSession($user->id, 'other-session-aaaaaaaaaaaaaaaaaaaa', [
        'last_activity' => now()->subHours(5)->timestamp,
    ]);
    insertUserSession($user->id, 'other-session-bbbbbbbbbbbbbbbbbbbbbb', [
        'last_activity' => now()->subDay()->timestamp,
    ]);

    $response = app(SessionsController::class)->index(
        sessionsRequestWithId($user, $currentSessionId),
    );

    expect($response->getStatusCode())->toBe(200);
    $sessions = $response->getData(true)['data']['sessions'];

    expect($sessions)->toHaveCount(3);
    expect(collect($sessions)->where('is_current', true)->count())->toBe(1);

    foreach ($sessions as $session) {
        expect(strlen($session['id']))->toBe(6);
        expect($session['id'])->not->toBe($currentSessionId);
    }

    $current = collect($sessions)->firstWhere('is_current', true);
    expect($current['id'])->toBe(substr($currentSessionId, -6));
});

it('lists sessions over http after login', function () {
    /** @var TestCase $this */
    $user = User::factory()->create([
        'password' => Hash::make('password123'),
    ]);

    $loginResponse = $this
        ->withHeaders(sessionStatefulHeaders())
        ->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])
        ->assertOk();

    $cookies = sessionsCookieJarFromResponse($loginResponse);

    insertUserSession($user->id, 'other-session-cccccccccccccccccccccccc');
    insertUserSession($user->id, 'other-session-dddddddddddddddddddddd');

    Auth::forgetGuards();

    $this
        ->withHeaders(sessionStatefulHeaders())
        ->withCookies($cookies)
        ->getJson('/api/v1/account/sessions')
        ->assertOk()
        ->assertJsonCount(3, 'data.sessions');
});

it('revokes other sessions keeping only the current one by session id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create([
        'password' => Hash::make('password123'),
    ]);

    $currentSessionId = 'current-session-id-for-revoke-test-000001';
    insertUserSession($user->id, $currentSessionId, [
        'last_activity' => now()->timestamp,
    ]);
    insertUserSession($user->id, 'other-session-cccccccccccccccccccccccc');
    insertUserSession($user->id, 'other-session-dddddddddddddddddddddd');

    $session = Mockery::mock(Store::class);
    $session->shouldReceive('getId')->andReturn($currentSessionId);

    $request = Request::create('/api/v1/account/sessions/revoke-others', 'POST', [
        'current_password' => 'password123',
    ]);
    $request->setLaravelSession($session);
    $request->setUserResolver(fn () => $user);

    $response = app(SessionsController::class)->destroyOthers($request);

    expect($response->getStatusCode())->toBe(200);
    expect($response->getData(true)['data']['revoked'])->toBe(2);

    $remaining = DB::table('sessions')
        ->where('user_id', $user->id)
        ->get();

    expect($remaining)->toHaveCount(1)
        ->and($remaining->first()->id)->toBe($currentSessionId);
});

it('rejects revoke-others with wrong password and does not delete sessions', function () {
    /** @var TestCase $this */
    $user = User::factory()->create([
        'password' => Hash::make('password123'),
    ]);

    $currentSessionId = Str::random(40);
    insertUserSession($user->id, $currentSessionId, [
        'last_activity' => now()->timestamp,
    ]);
    insertUserSession($user->id, Str::random(40));
    insertUserSession($user->id, Str::random(40));

    $session = Mockery::mock(Store::class);
    $session->shouldReceive('getId')->andReturn($currentSessionId);

    $request = Request::create('/api/v1/account/sessions/revoke-others', 'POST', [
        'current_password' => 'wrong-password',
    ]);
    $request->setLaravelSession($session);
    $request->setUserResolver(fn () => $user);

    $response = app(SessionsController::class)->destroyOthers($request);

    expect($response->getStatusCode())->toBe(422);
    expect($response->getData(true)['errors']['current_password'])->not->toBeEmpty();

    expect(DB::table('sessions')->where('user_id', $user->id)->count())->toBe(3);
});

it('rejects unauthenticated access', function () {
    /** @var TestCase $this */
    $this->getJson('/api/v1/account/sessions')->assertUnauthorized();
    $this->postJson('/api/v1/account/sessions/revoke-others', [
        'current_password' => 'password123',
    ])->assertUnauthorized();
});
