<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum SPA: EnsureFrontendRequestsAreStateful activa StartSession + VerifyCsrfToken
        // SOLO si el request viene con Origin/Referer de un dominio listado en
        // SANCTUM_STATEFUL_DOMAINS. En testing inyectamos Origin=http://localhost para que
        // los flujos de sesión (login/register/logout) funcionen sin necesidad de tocar
        // cada test. En entorno testing, además, el CSRF está exento (ver bootstrap/app.php).
        $this->withHeaders([
            'Origin' => 'http://localhost',
            'Referer' => 'http://localhost',
            // Sin esto, los POST multipart (con UploadedFile) fallan con 302 al validar:
            // ValidationException redirige (web) en vez de devolver 422 JSON.
            'Accept' => 'application/json',
        ]);
    }
}
