<?php

use App\Enums\Plan;
use App\Models\Business;
use App\Models\User;
use App\Notifications\VerifyEmailEs;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

uses(RefreshDatabase::class);

/**
 * Helper local: el proyecto NO tiene `BusinessFactory` y la relación
 * `User → Business` está implementada con la FK `users.business_id`
 * (User belongsTo Business). Por eso no podemos hacer
 * `Business::factory()->create(['user_id' => …])`: aquí creamos el negocio
 * con `Business::create([…])` (mismo patrón que el resto del suite, ver
 * `tests/Feature/Api/SubscriptionLifecycleTest.php`) y enlazamos el FK en el
 * usuario con `forceFill`, igual que hacen los demás feature tests.
 */
function createBusinessForUser(User $user, string $name): Business
{
    $business = Business::create([
        'name' => $name,
        'subdomain' => 'acc-'.substr(bin2hex(random_bytes(4)), 0, 10),
        'subdomain_type' => 'random',
        'sector' => 'otros',
        'plan' => Plan::Free,
        'is_published' => true,
    ]);
    $user->forceFill(['business_id' => $business->id])->save();

    return $business;
}

/**
 * Pest enlaza `$this` al `Tests\TestCase` dentro de cada closure de `it(...)`,
 * pero intelephense no infiere ese binding y marca como "undefined method"
 * helpers como `actingAs`, `getJson`, `patchJson` o `postJson`. El
 * `/** @var TestCase $this *\/` que añadimos al inicio de cada closure le
 * dice al IDE qué tipo es `$this` en ese ámbito (los métodos los inyectan
 * los traits via `@mixin` en `Tests\TestCase`); a runtime no cambia nada.
 */
it('devuelve perfil del usuario autenticado', function () {
    /** @var TestCase $this */
    $user = User::factory()->create([
        'name' => 'Ana Pérez',
        'email' => 'ana@example.com',
    ]);

    $response = $this->actingAs($user)->getJson('/api/v1/account/profile');

    $response->assertOk()
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.name', 'Ana Pérez')
        ->assertJsonPath('data.user.email', 'ana@example.com');
});

it('incluye business_name cuando el usuario tiene negocio', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    createBusinessForUser($user, 'Cafetería Luna');

    $response = $this->actingAs($user)->getJson('/api/v1/account/profile');

    $response->assertOk()->assertJsonPath('data.business_name', 'Cafetería Luna');
});

it('devuelve business_name null cuando no hay negocio', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/v1/account/profile');

    $response->assertOk()->assertJsonPath('data.business_name', null);
});

it('rechaza acceso sin autenticar', function () {
    /** @var TestCase $this */
    $this->getJson('/api/v1/account/profile')->assertUnauthorized();
    $this->patchJson('/api/v1/account/profile', ['name' => 'X'])->assertUnauthorized();
    $this->postJson('/api/v1/account/password', [])->assertUnauthorized();
});

it('actualiza solo el nombre sin tocar email_verified_at', function () {
    /** @var TestCase $this */
    $verifiedAt = now()->subDay();
    $user = User::factory()->create([
        'name' => 'Antiguo',
        'email_verified_at' => $verifiedAt,
    ]);

    $response = $this->actingAs($user)
        ->patchJson('/api/v1/account/profile', ['name' => 'Nuevo']);

    $response->assertOk()
        ->assertJsonPath('data.user.name', 'Nuevo')
        ->assertJsonPath('data.email_changed', false);

    expect($user->fresh()->email_verified_at)->not->toBeNull();
});

it('actualiza email y resetea email_verified_at', function () {
    /** @var TestCase $this */
    Notification::fake();
    $user = User::factory()->create([
        'email' => 'viejo@example.com',
        'email_verified_at' => now()->subDay(),
    ]);

    $response = $this->actingAs($user)
        ->patchJson('/api/v1/account/profile', ['email' => 'nuevo@example.com']);

    $response->assertOk()
        ->assertJsonPath('data.user.email', 'nuevo@example.com')
        ->assertJsonPath('data.user.email_verified_at', null)
        ->assertJsonPath('data.email_changed', true);

    expect($user->fresh()->email_verified_at)->toBeNull();
    Notification::assertSentTo($user->fresh(), VerifyEmailEs::class);
});

it('no envía notificación de verificación cuando solo cambia el nombre', function () {
    /** @var TestCase $this */
    Notification::fake();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patchJson('/api/v1/account/profile', ['name' => 'Otro nombre'])
        ->assertOk();

    Notification::assertNothingSent();
});

it('rechaza email duplicado de otro usuario', function () {
    /** @var TestCase $this */
    User::factory()->create(['email' => 'tomado@example.com']);
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->patchJson('/api/v1/account/profile', ['email' => 'tomado@example.com']);

    $response->assertStatus(422)->assertJsonValidationErrors('email');
});

it('permite enviar el mismo email del usuario sin error', function () {
    /** @var TestCase $this */
    $user = User::factory()->create(['email' => 'mio@example.com']);

    $this->actingAs($user)
        ->patchJson('/api/v1/account/profile', ['email' => 'mio@example.com'])
        ->assertOk();
});

it('cambia contraseña con current_password correcta', function () {
    /** @var TestCase $this */
    $user = User::factory()->create(['password' => Hash::make('viejaPassword1')]);

    $response = $this->actingAs($user)->postJson('/api/v1/account/password', [
        'current_password' => 'viejaPassword1',
        'password' => 'nuevaPassword2',
        'password_confirmation' => 'nuevaPassword2',
    ]);

    $response->assertOk()->assertJsonPath('data.message', 'Contraseña actualizada');
    expect(Hash::check('nuevaPassword2', $user->fresh()->password))->toBeTrue();
});

it('rechaza cambio de contraseña con current_password incorrecta', function () {
    /** @var TestCase $this */
    $user = User::factory()->create(['password' => Hash::make('viejaPassword1')]);

    $response = $this->actingAs($user)->postJson('/api/v1/account/password', [
        'current_password' => 'esoNoEs',
        'password' => 'nuevaPassword2',
        'password_confirmation' => 'nuevaPassword2',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('current_password');
    expect(Hash::check('viejaPassword1', $user->fresh()->password))->toBeTrue();
});

it('rechaza nueva contraseña igual a la actual', function () {
    /** @var TestCase $this */
    $user = User::factory()->create(['password' => Hash::make('mismaPassword1')]);

    $response = $this->actingAs($user)->postJson('/api/v1/account/password', [
        'current_password' => 'mismaPassword1',
        'password' => 'mismaPassword1',
        'password_confirmation' => 'mismaPassword1',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('password');
});

it('rechaza cambio de contraseña sin confirmación', function () {
    /** @var TestCase $this */
    $user = User::factory()->create(['password' => Hash::make('viejaPassword1')]);

    $response = $this->actingAs($user)->postJson('/api/v1/account/password', [
        'current_password' => 'viejaPassword1',
        'password' => 'nuevaPassword2',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('password');
});

it('rechaza nueva contraseña menor de 8 caracteres', function () {
    /** @var TestCase $this */
    $user = User::factory()->create(['password' => Hash::make('viejaPassword1')]);

    $response = $this->actingAs($user)->postJson('/api/v1/account/password', [
        'current_password' => 'viejaPassword1',
        'password' => 'corta',
        'password_confirmation' => 'corta',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('password');
});

it('rechaza contraseña sin current_password', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/v1/account/password', [
        'password' => 'nuevaPassword2',
        'password_confirmation' => 'nuevaPassword2',
    ]);

    $response->assertStatus(422)->assertJsonValidationErrors('current_password');
});
