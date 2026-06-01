<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns business_deleted when business is soft-deleted', function () {
    $business = Business::create([
        'name' => 'Eliminado',
        'subdomain' => 'eliminado-test',
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);
    $user = User::factory()->create(['business_id' => $business->id]);
    $business->delete();

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/business')
        ->assertForbidden()
        ->assertJson([
            'message' => 'Tu negocio ha sido eliminado.',
            'code' => 'business_deleted',
        ])
        ->assertJsonMissing(['redirect' => '/onboarding']);
});

it('redirects to onboarding when user has no business', function () {
    $user = User::factory()->create(['business_id' => null]);

    test()->actingAs($user)
        ->getJson('/api/v1/dashboard/business')
        ->assertForbidden()
        ->assertJson([
            'message' => 'Onboarding no completado',
            'redirect' => '/onboarding',
        ]);
});

// TODO(front): En 403 con `code: business_deleted`, redirigir a una pantalla de cuenta
// cerrada / soporte (p. ej. logout + mensaje), no a `/onboarding`. `front/src/api/client.ts`
// solo trata 401; el redirect a onboarding suele venir de `response.data.redirect` en
// llamadas al dashboard — hay que distinguir `business_deleted` de onboarding incompleto.
