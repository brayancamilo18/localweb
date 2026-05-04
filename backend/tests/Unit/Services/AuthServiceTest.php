<?php

use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\Auth\TooManyLoginAttemptsException;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('attemptLogin returns user for valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'valid@localweb.com',
        'password' => Hash::make('password123'),
    ]);

    $service = new AuthService();
    $authenticated = $service->attemptLogin('valid@localweb.com', 'password123');

    expect($authenticated->id)->toBe($user->id);
});

it('attemptLogin throws InvalidCredentialsException for invalid credentials', function () {
    User::factory()->create([
        'email' => 'invalid@localweb.com',
        'password' => Hash::make('password123'),
    ]);

    $service = new AuthService();
    $service->attemptLogin('invalid@localweb.com', 'bad-password');
})->throws(InvalidCredentialsException::class);

it('checkRateLimit throws TooManyLoginAttemptsException after five failed attempts', function () {
    Cache::flush();
    $service = new AuthService();
    $key = 'login:127.0.0.1:test@localweb.com';

    for ($i = 0; $i < 5; $i++) {
        $service->incrementFailedAttempts($key);
    }

    $service->checkRateLimit($key);
})->throws(TooManyLoginAttemptsException::class);

it('clearRateLimit resets failed attempts counter', function () {
    Cache::flush();
    $service = new AuthService();
    $key = 'login:127.0.0.1:test@localweb.com';

    $service->incrementFailedAttempts($key);
    $service->clearRateLimit($key);

    $service->checkRateLimit($key);

    expect(Cache::get("{$key}:attempts"))->toBeNull();
});
