<?php

uses(Tests\TestCase::class)->in('Feature', 'Unit');

/**
 * Payload mínimo válido para POST /api/v1/auth/register (incluye datos de negocio).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validRegisterPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Test User',
        'email' => 'user-'.uniqid('', true).'@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'business_name' => 'Mi Salón',
        'sector' => 'peluqueria',
        'city' => 'Madrid',
        'country' => 'España',
        'country_code' => 'ES',
        'accept_terms' => true,
    ], $overrides);
}
