<?php

use App\Enums\Plan;
use App\Models\AiGeneration;
use App\Models\Business;
use App\Models\User;
use App\Services\Ai\AiProviderContract;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function aiSocialProUser(array $businessOverrides = []): User
{
    $business = Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'sector' => 'peluqueria',
        'city' => 'Madrid',
    ], $businessOverrides));

    return User::factory()->create(['business_id' => $business->id]);
}

function aiSocialFreeUser(): User
{
    $business = Business::factory()->create([
        'plan' => Plan::Free,
        'sector' => 'peluqueria',
        'city' => 'Madrid',
    ]);

    return User::factory()->create(['business_id' => $business->id]);
}

function enableAiForSocialTests(): void
{
    config([
        'ai.enabled' => true,
        'ai.claude_api_key' => 'test-fake-key',
    ]);
}

function validSocialPayload(array $overrides = []): array
{
    return array_merge([
        'network' => 'instagram',
        'tone' => 'profesional',
    ], $overrides);
}

it('returns 403 for free users', function () {
    enableAiForSocialTests();

    $user = aiSocialFreeUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', validSocialPayload())
        ->assertStatus(403)
        ->assertJsonPath('message', 'Esta función solo está disponible en el plan Pro.');
});

it('returns 503 when AI features are disabled for pro users', function () {
    config(['ai.enabled' => false]);

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', validSocialPayload())
        ->assertStatus(503)
        ->assertJsonPath('message', 'La generación con IA no está disponible en este momento.');
});

it('returns generated post text when AI is enabled', function () {
    enableAiForSocialTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Cortes con estilo en el corazón de Madrid. Pide tu cita 💈 #peluqueria #madrid #barberia #estilo #corte');

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', validSocialPayload(['topic' => 'nueva temporada de verano']))
        ->assertOk()
        ->assertJsonPath('data.text', 'Cortes con estilo en el corazón de Madrid. Pide tu cita 💈 #peluqueria #madrid #barberia #estilo #corte');
});

it('returns 422 when network is missing', function () {
    enableAiForSocialTests();

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', ['tone' => 'profesional'])
        ->assertStatus(422);
});

it('returns 422 for invalid network', function () {
    enableAiForSocialTests();

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', ['network' => 'tiktok', 'tone' => 'profesional'])
        ->assertStatus(422);
});

it('returns 422 for invalid tone', function () {
    enableAiForSocialTests();

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', ['network' => 'instagram', 'tone' => 'agresivo'])
        ->assertStatus(422);
});

it('returns 429 when daily quota is exceeded', function () {
    enableAiForSocialTests();
    config(['ai.daily_limits.social_posts' => 1]);

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Post de prueba para redes sociales.');

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', validSocialPayload())
        ->assertOk();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', validSocialPayload())
        ->assertStatus(429)
        ->assertJsonPath('message', 'Has alcanzado el límite diario de generaciones con IA.');
});

it('records an ai_generation row after a successful call', function () {
    enableAiForSocialTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Post de prueba para Instagram.');

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', validSocialPayload())
        ->assertOk();

    expect(AiGeneration::where('user_id', $user->id)->where('feature', 'social_posts')->count())->toBe(1);
});

it('returns 422 when topic exceeds 200 chars', function () {
    enableAiForSocialTests();

    $user = aiSocialProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/social-post', validSocialPayload(['topic' => str_repeat('a', 201)]))
        ->assertStatus(422);
});
