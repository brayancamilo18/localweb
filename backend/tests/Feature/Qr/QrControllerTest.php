<?php

use App\Models\Business;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(RefreshDatabase::class);

function makeTemplate(string $color = '#2563EB'): Template
{
    return Template::create([
        'name' => 'Test Template',
        'slug' => 'test-'.uniqid(),
        'primary_color' => $color,
        'is_active' => true,
        'requires_pro' => false,
    ]);
}

function makeProUserWithTemplate(string $color = '#2563EB'): User
{
    $template = makeTemplate($color);
    $business = Business::create([
        'name' => 'Cafetería Luna',
        'subdomain' => 'cafeluna'.uniqid(),
        'subdomain_type' => 'custom',
        'sector' => 'cafe',
        'plan' => 'pro',
        'template_id' => $template->id,
    ]);

    return User::factory()->create(['business_id' => $business->id]);
}

function makeFreeUserWithTemplate(string $color = '#FF6B00'): User
{
    $template = makeTemplate($color);
    $business = Business::create([
        'name' => 'Panadería Pepe',
        'subdomain' => 'pepe'.uniqid(),
        'subdomain_type' => 'custom',
        'sector' => 'panaderia',
        'plan' => 'free',
        'template_id' => $template->id,
    ]);

    return User::factory()->create(['business_id' => $business->id]);
}

// ─── info ───────────────────────────────────────────────────────

it('devuelve info de QR para usuario Pro con default_color del template', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate('#2563EB');

    $response = $this->actingAs($user)->getJson('/api/v1/qr/info');

    $response->assertOk()
        ->assertJsonPath('data.is_pro', true)
        ->assertJsonPath('data.business_name', 'Cafetería Luna')
        ->assertJsonPath('data.default_color', '#2563EB')
        ->assertJsonPath('data.template_color', '#2563EB');
});

it('devuelve info de QR para usuario Free con is_pro=false pero también incluye default_color', function () {
    /** @var TestCase $this */
    $user = makeFreeUserWithTemplate('#FF6B00');

    $response = $this->actingAs($user)->getJson('/api/v1/qr/info');

    $response->assertOk()
        ->assertJsonPath('data.is_pro', false)
        ->assertJsonPath('data.default_color', '#FF6B00');
});

it('rechaza info si no hay negocio o subdominio', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    $this->actingAs($user)->getJson('/api/v1/qr/info')->assertStatus(422);
});

it('rechaza info sin autenticar', function () {
    /** @var TestCase $this */
    $this->getJson('/api/v1/qr/info')->assertUnauthorized();
});

// ─── png ────────────────────────────────────────────────────────

it('descarga PNG del QR para usuario Pro', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate('#2563EB');

    $response = $this->actingAs($user)->get('/api/v1/qr/png');

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toBe('image/png');
    expect($response->headers->get('Content-Disposition'))->toContain('.png');
    expect(bin2hex(substr($response->getContent(), 0, 4)))->toBe('89504e47');
});

it('respeta el override de color válido en query string', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate('#2563EB');

    $r = $this->actingAs($user)->get('/api/v1/qr/png?color=%23FF0000');
    $r->assertOk();
    expect($r->headers->get('Content-Type'))->toBe('image/png');
});

it('ignora silenciosamente un color override inválido', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate('#2563EB');

    $r = $this->actingAs($user)->get('/api/v1/qr/png?color=rojo');
    $r->assertOk();
});

it('respeta el parámetro size dentro de los límites', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate();

    $r1 = $this->actingAs($user)->get('/api/v1/qr/png?size=512');
    $r1->assertOk();
    expect(strlen($r1->getContent()))->toBeGreaterThan(100);

    $r2 = $this->actingAs($user)->get('/api/v1/qr/png?size=999999');
    $r2->assertOk();
});

it('rechaza descarga PNG para usuario Free con 403', function () {
    /** @var TestCase $this */
    $user = makeFreeUserWithTemplate();
    $this->actingAs($user)->get('/api/v1/qr/png')->assertStatus(403);
});

it('rechaza descarga PNG sin autenticar', function () {
    /** @var TestCase $this */
    $this->get('/api/v1/qr/png')->assertUnauthorized();
});

// ─── poster ─────────────────────────────────────────────────────

it('genera póster PDF A4 para Pro con color heredado del template', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate('#2563EB');

    $response = $this->actingAs($user)->post('/api/v1/qr/poster', [
        'size' => 'a4',
        'message' => '¡Escanéame!',
    ]);

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('application/pdf');
    expect(substr($response->getContent(), 0, 4))->toBe('%PDF');
});

it('genera póster PDF en los 3 tamaños', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate();

    foreach (['a4', 'a5', 'square'] as $size) {
        $r = $this->actingAs($user)->post('/api/v1/qr/poster', ['size' => $size]);
        $r->assertOk();
        expect($r->headers->get('Content-Type'))->toContain('application/pdf');
    }
});

it('usa valores por defecto cuando no se pasan parámetros', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate();
    $this->actingAs($user)->post('/api/v1/qr/poster', [])->assertOk();
});

it('rechaza tamaño no válido', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate();
    $this->actingAs($user)
        ->postJson('/api/v1/qr/poster', ['size' => 'letter'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('size');
});

it('rechaza color con formato inválido', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate();
    $this->actingAs($user)
        ->postJson('/api/v1/qr/poster', ['color' => 'rojo'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('color');
});

it('rechaza mensaje de más de 80 caracteres', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate();
    $this->actingAs($user)
        ->postJson('/api/v1/qr/poster', ['message' => str_repeat('a', 81)])
        ->assertStatus(422)
        ->assertJsonValidationErrors('message');
});

it('acepta color override válido en el body', function () {
    /** @var TestCase $this */
    $user = makeProUserWithTemplate('#2563EB');

    $r = $this->actingAs($user)->post('/api/v1/qr/poster', [
        'size' => 'a4',
        'color' => '#FF0000',
    ]);
    $r->assertOk();
});

it('rechaza póster para usuario Free con 403', function () {
    /** @var TestCase $this */
    $user = makeFreeUserWithTemplate();
    $this->actingAs($user)
        ->postJson('/api/v1/qr/poster', ['size' => 'a4'])
        ->assertStatus(403);
});

it('rechaza póster sin autenticar', function () {
    /** @var TestCase $this */
    $this->postJson('/api/v1/qr/poster')->assertUnauthorized();
});
