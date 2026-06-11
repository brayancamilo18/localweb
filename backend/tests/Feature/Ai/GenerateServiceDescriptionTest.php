<?php

use App\Enums\Plan;
use App\Models\AiGeneration;
use App\Models\Business;
use App\Models\User;
use App\Services\Ai\AiProviderContract;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function aiServiceProUser(array $businessOverrides = []): User
{
    $business = Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'sector' => 'peluqueria',
        'city' => 'Madrid',
    ], $businessOverrides));

    return User::factory()->create(['business_id' => $business->id]);
}

function aiServiceFreeUser(): User
{
    $business = Business::factory()->create([
        'plan' => Plan::Free,
        'sector' => 'peluqueria',
        'city' => 'Madrid',
    ]);

    return User::factory()->create(['business_id' => $business->id]);
}

function enableAiForServiceTests(): void
{
    config([
        'ai.enabled' => true,
        'ai.claude_api_key' => 'test-fake-key',
    ]);
}

it('returns 403 for free users', function () {
    enableAiForServiceTests();

    $user = aiServiceFreeUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Corte de pelo',
        ])
        ->assertStatus(403)
        ->assertJsonPath('message', 'Esta función solo está disponible en el plan Pro.');
});

it('returns 503 when AI features are disabled for pro users', function () {
    config(['ai.enabled' => false]);

    $user = aiServiceProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Corte de pelo',
        ])
        ->assertStatus(503)
        ->assertJsonPath('message', 'La generación con IA no está disponible en este momento.');
});

it('returns description and suggested price range when AI is enabled', function () {
    enableAiForServiceTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Descripción breve del servicio.|||22|||35');

    $user = aiServiceProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Corte de pelo',
        ])
        ->assertOk()
        ->assertJsonPath('data.description', 'Descripción breve del servicio.')
        ->assertJsonPath('data.suggested_price_min', 22)
        ->assertJsonPath('data.suggested_price_max', 35);
});

it('returns 422 when service_name is missing', function () {
    enableAiForServiceTests();

    $user = aiServiceProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [])
        ->assertStatus(422);
});

it('returns 429 when daily quota is exceeded', function () {
    enableAiForServiceTests();
    config(['ai.daily_limits.service_description' => 1]);

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Descripción breve del servicio.|||22|||35');

    $user = aiServiceProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Corte de pelo',
        ])
        ->assertOk();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Barba',
        ])
        ->assertStatus(429)
        ->assertJsonPath('message', 'Has alcanzado el límite diario de generaciones con IA.');
});

it('returns description with null prices when price parts are not numeric', function () {
    enableAiForServiceTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Solo descripción|||x|||y');

    $user = aiServiceProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Corte de pelo',
        ])
        ->assertOk()
        ->assertJsonPath('data.description', 'Solo descripción')
        ->assertJsonPath('data.suggested_price_min', null)
        ->assertJsonPath('data.suggested_price_max', null);
});

it('returns 503 when description is empty after parsing', function () {
    enableAiForServiceTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('|||22|||35');

    $user = aiServiceProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Corte de pelo',
        ])
        ->assertStatus(503)
        ->assertJsonPath('message', 'La generación con IA no está disponible en este momento.');
});

it('records an ai_generation row after a successful call', function () {
    enableAiForServiceTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Descripción breve del servicio.|||22|||35');

    $user = aiServiceProUser();

    test()->actingAs($user)
        ->postJson('/api/v1/ai/service-description', [
            'service_name' => 'Corte de pelo',
        ])
        ->assertOk();

    expect(AiGeneration::query()->count())->toBe(1);

    $generation = AiGeneration::query()->first();
    expect($generation->feature)->toBe('service_description')
        ->and($generation->user_id)->toBe($user->id)
        ->and($generation->business_id)->toBe($user->business_id);
});
