<?php

use App\Models\AiGeneration;
use App\Models\Business;
use App\Models\User;
use App\Services\Ai\AiProviderContract;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function aiBusinessUser(array $businessOverrides = []): User
{
    $business = Business::factory()->create(array_merge([
        'sector' => 'peluqueria',
        'city' => 'Madrid',
    ], $businessOverrides));

    return User::factory()->create(['business_id' => $business->id]);
}

function enableAiForTests(): void
{
    config([
        'ai.enabled' => true,
        'ai.claude_api_key' => 'test-fake-key',
    ]);
}

it('returns 503 when AI features are disabled', function () {
    config(['ai.enabled' => false]);

    $user = aiBusinessUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', [
            'business_name' => 'Mi Salón',
        ])
        ->assertStatus(503)
        ->assertJsonPath('message', 'La generación con IA no está disponible en este momento.');
});

it('returns three description variants when AI is enabled', function () {
    enableAiForTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Variante uno|||Variante dos|||Variante tres');

    $user = aiBusinessUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', [
            'business_name' => 'Mi Salón',
            'tagline' => 'Belleza con estilo',
        ])
        ->assertOk()
        ->assertJsonPath('data.variants', ['Variante uno', 'Variante dos', 'Variante tres']);
});

it('returns 429 when daily quota is exceeded', function () {
    enableAiForTests();
    config(['ai.daily_limits.business_description' => 2]);

    $mock = $this->mock(AiProviderContract::class);
    $mock->shouldReceive('complete')
        ->twice()
        ->andReturn('Variante uno|||Variante dos|||Variante tres');

    $user = aiBusinessUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', ['business_name' => 'Mi Salón'])
        ->assertOk();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', ['business_name' => 'Mi Salón'])
        ->assertOk();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', ['business_name' => 'Mi Salón'])
        ->assertStatus(429)
        ->assertJsonPath('message', 'Has alcanzado el límite diario de generaciones con IA.');
});

it('returns 422 when business_name is missing', function () {
    enableAiForTests();

    $user = aiBusinessUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', [])
        ->assertStatus(422);
});

it('returns 404 when user has no business', function () {
    enableAiForTests();

    $user = User::factory()->create(['business_id' => null]);

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', [
            'business_name' => 'Mi Salón',
        ])
        ->assertStatus(404)
        ->assertJsonPath('message', 'Negocio no encontrado');
});

it('returns quota info with enabled flag and remaining counts', function () {
    enableAiForTests();

    $user = aiBusinessUser();

    test()->actingAs($user)
        ->getJson('/api/v1/ai/quota')
        ->assertOk()
        ->assertJsonPath('data.enabled', true)
        ->assertJsonStructure(['data' => ['enabled', 'remaining' => ['business_description']]]);
});

it('records an ai_generation row after a successful call', function () {
    enableAiForTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Variante uno|||Variante dos|||Variante tres');

    $user = aiBusinessUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/business-description', [
            'business_name' => 'Mi Salón',
        ])
        ->assertOk();

    expect(AiGeneration::query()->count())->toBe(1);

    $generation = AiGeneration::query()->first();
    expect($generation->feature)->toBe('business_description')
        ->and($generation->user_id)->toBe($user->id)
        ->and($generation->business_id)->toBe($user->business_id);
});
