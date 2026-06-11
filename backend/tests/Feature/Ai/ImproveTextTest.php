<?php

use App\Enums\Plan;
use App\Models\AiGeneration;
use App\Models\Business;
use App\Models\User;
use App\Services\Ai\AiProviderContract;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function aiImproveProUser(array $businessOverrides = []): User
{
    $business = Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'sector' => 'peluqueria',
        'city' => 'Madrid',
    ], $businessOverrides));

    return User::factory()->create(['business_id' => $business->id]);
}

function aiImproveFreeUser(): User
{
    $business = Business::factory()->create([
        'plan' => Plan::Free,
        'sector' => 'peluqueria',
        'city' => 'Madrid',
    ]);

    return User::factory()->create(['business_id' => $business->id]);
}

function enableAiForImproveTests(): void
{
    config([
        'ai.enabled' => true,
        'ai.claude_api_key' => 'test-fake-key',
    ]);
}

function validImprovePayload(array $overrides = []): array
{
    return array_merge([
        'text' => 'Cortes con criterio en Lavapiés',
        'tone' => 'profesional',
        'field' => 'tagline',
    ], $overrides);
}

it('returns 403 for free users', function () {
    enableAiForImproveTests();

    $user = aiImproveFreeUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload())
        ->assertStatus(403)
        ->assertJsonPath('message', 'Esta función solo está disponible en el plan Pro.');
});

it('returns 503 when AI features are disabled for pro users', function () {
    config(['ai.enabled' => false]);

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload())
        ->assertStatus(503)
        ->assertJsonPath('message', 'La generación con IA no está disponible en este momento.');
});

it('returns improved text when AI is enabled', function () {
    enableAiForImproveTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Texto mejorado de prueba.');

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload())
        ->assertOk()
        ->assertJsonPath('data.text', 'Texto mejorado de prueba.');
});

it('returns 422 when text is missing', function () {
    enableAiForImproveTests();

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', [
            'tone' => 'profesional',
            'field' => 'tagline',
        ])
        ->assertStatus(422);
});

it('returns 422 for invalid tone', function () {
    enableAiForImproveTests();

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload(['tone' => 'inventado']))
        ->assertStatus(422);
});

it('returns 422 for invalid field', function () {
    enableAiForImproveTests();

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload(['field' => 'name']))
        ->assertStatus(422);
});

it('returns 422 when text is too short', function () {
    enableAiForImproveTests();

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload(['text' => 'abc']))
        ->assertStatus(422);
});

it('returns 429 when daily quota is exceeded', function () {
    enableAiForImproveTests();
    config(['ai.daily_limits.improve_text' => 1]);

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Texto mejorado de prueba.');

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload())
        ->assertOk();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload(['text' => 'Otro texto válido aquí']))
        ->assertStatus(429)
        ->assertJsonPath('message', 'Has alcanzado el límite diario de generaciones con IA.');
});

it('returns 503 when improved text is empty after parsing', function () {
    enableAiForImproveTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('');

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload())
        ->assertStatus(503)
        ->assertJsonPath('message', 'La generación con IA no está disponible en este momento.');
});

it('truncates long description results to 500 characters', function () {
    enableAiForImproveTests();

    $longText = str_repeat('a', 800);

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn($longText);

    $user = aiImproveProUser();

    $response = test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload([
            'field' => 'description',
            'text' => 'Descripción inicial con suficiente longitud',
        ]))
        ->assertOk();

    expect(mb_strlen($response->json('data.text')))->toBeLessThanOrEqual(500);
});

it('strips wrapping quotes from improved text', function () {
    enableAiForImproveTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('"texto bonito"');

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload())
        ->assertOk()
        ->assertJsonPath('data.text', 'texto bonito');
});

it('records an ai_generation row after a successful call', function () {
    enableAiForImproveTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Texto mejorado de prueba.');

    $user = aiImproveProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/improve-text', validImprovePayload())
        ->assertOk();

    expect(AiGeneration::query()->count())->toBe(1);

    $generation = AiGeneration::query()->first();
    expect($generation->feature)->toBe('improve_text')
        ->and($generation->user_id)->toBe($user->id)
        ->and($generation->business_id)->toBe($user->business_id);
});
