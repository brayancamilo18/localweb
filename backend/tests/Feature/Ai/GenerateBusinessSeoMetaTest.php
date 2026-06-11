<?php

use App\Enums\Plan;
use App\Exceptions\Ai\AiQuotaExceededException;
use App\Exceptions\Ai\AiUnavailableException;
use App\Jobs\GenerateBusinessSeoMeta;
use App\Models\AiGeneration;
use App\Models\Business;
use App\Models\User;
use App\Services\Ai\AiProviderContract;
use App\Services\Ai\AiTextService;
use App\Services\SeoMetaBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function seoMetaProBusiness(array $overrides = []): Business
{
    return Business::factory()->create(array_merge([
        'plan' => Plan::Pro,
        'name' => 'Barbería El Corte',
        'sector' => 'peluqueria',
        'city' => 'Madrid',
        'tagline' => 'Estilo urbano',
        'description' => 'Cortes y barba en el centro de Madrid.',
    ], $overrides));
}

function seoMetaProUser(Business $business): User
{
    return User::factory()->create(['business_id' => $business->id]);
}

function enableAiForSeoMetaTests(): void
{
    config([
        'ai.enabled' => true,
        'ai.claude_api_key' => 'test-fake-key',
    ]);
}

it('returns seo title and description when AI is enabled', function () {
    enableAiForSeoMetaTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Barbería El Corte Madrid|||Cortes y barba en el centro de Madrid. Reserva tu cita.');

    $business = seoMetaProBusiness();
    $user = seoMetaProUser($business);

    $result = app(AiTextService::class)->generateBusinessSeoMeta($user, $business);

    expect($result)->toBe([
        'seo_title' => 'Barbería El Corte Madrid',
        'seo_description' => 'Cortes y barba en el centro de Madrid. Reserva tu cita.',
    ]);
});

it('throws when AI features are disabled', function () {
    config(['ai.enabled' => false]);

    $business = seoMetaProBusiness();
    $user = seoMetaProUser($business);

    app(AiTextService::class)->generateBusinessSeoMeta($user, $business);
})->throws(AiUnavailableException::class);

it('throws when daily seo_meta quota is exceeded', function () {
    enableAiForSeoMetaTests();
    config(['ai.daily_limits.seo_meta' => 1]);

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Título SEO|||Descripción SEO para la página.');

    $business = seoMetaProBusiness();
    $user = seoMetaProUser($business);
    $service = app(AiTextService::class);

    $service->generateBusinessSeoMeta($user, $business);

    $service->generateBusinessSeoMeta($user, $business);
})->throws(AiQuotaExceededException::class);

it('throws when parsed seo meta is empty', function () {
    enableAiForSeoMetaTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('|||');

    $business = seoMetaProBusiness();
    $user = seoMetaProUser($business);

    app(AiTextService::class)->generateBusinessSeoMeta($user, $business);
})->throws(AiUnavailableException::class);

it('truncates long seo meta to field limits', function () {
    enableAiForSeoMetaTests();

    $longTitle = str_repeat('T', 80);
    $longDescription = str_repeat('D', 200);

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn("{$longTitle}|||{$longDescription}");

    $business = seoMetaProBusiness();
    $user = seoMetaProUser($business);

    $result = app(AiTextService::class)->generateBusinessSeoMeta($user, $business);

    expect(mb_strlen($result['seo_title']))->toBe(60)
        ->and(mb_strlen($result['seo_description']))->toBe(160);
});

it('job persists seo columns and records ai_generation on success', function () {
    enableAiForSeoMetaTests();

    $this->mock(AiProviderContract::class)
        ->shouldReceive('complete')
        ->once()
        ->andReturn('Barbería El Corte|||Cortes y barba en Madrid con estilo urbano.');

    $business = seoMetaProBusiness(['seo_title' => null, 'seo_description' => null]);
    $user = seoMetaProUser($business);

    (new GenerateBusinessSeoMeta($business->id))->handle(app(AiTextService::class));

    $business->refresh();

    expect($business->seo_title)->toBe('Barbería El Corte')
        ->and($business->seo_description)->toBe('Cortes y barba en Madrid con estilo urbano.')
        ->and(AiGeneration::where('user_id', $user->id)->where('feature', 'seo_meta')->count())->toBe(1);
});

it('job leaves seo columns null when AI is disabled', function () {
    config(['ai.enabled' => false]);

    $business = seoMetaProBusiness(['seo_title' => null, 'seo_description' => null]);
    seoMetaProUser($business);

    (new GenerateBusinessSeoMeta($business->id))->handle(app(AiTextService::class));

    $business->refresh();

    expect($business->seo_title)->toBeNull()
        ->and($business->seo_description)->toBeNull();
});

it('job leaves seo columns null when quota is exceeded', function () {
    enableAiForSeoMetaTests();
    config(['ai.daily_limits.seo_meta' => 0]);

    $business = seoMetaProBusiness(['seo_title' => null, 'seo_description' => null]);
    seoMetaProUser($business);

    (new GenerateBusinessSeoMeta($business->id))->handle(app(AiTextService::class));

    $business->refresh();

    expect($business->seo_title)->toBeNull()
        ->and($business->seo_description)->toBeNull();
});

it('SeoMetaBuilder prefers seo_title and seo_description overrides', function () {
    $business = Business::factory()->create([
        'name' => 'Nombre clásico',
        'tagline' => 'Tagline clásico',
        'description' => str_repeat('x', 200),
        'seo_title' => 'Título IA personalizado',
        'seo_description' => 'Descripción IA personalizada para buscadores.',
    ]);

    $seo = app(SeoMetaBuilder::class)->build($business);

    expect($seo['title'])->toBe('Título IA personalizado')
        ->and($seo['description'])->toBe('Descripción IA personalizada para buscadores.');
});
