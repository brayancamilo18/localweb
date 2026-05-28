<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(RefreshDatabase::class);

function dashboardImagesUser(): User
{
    $business = Business::create([
        'name' => 'B',
        'subdomain' => 'img-up-'.substr(bin2hex(random_bytes(4)), 0, 8),
        'subdomain_type' => 'random',
        'sector' => 'otros',
    ]);

    return User::factory()->create(['business_id' => $business->id]);
}

it('sube una imagen de galería de tamaño normal', function () {
    /** @var TestCase $this */
    Storage::fake('r2');
    $user = dashboardImagesUser();

    $response = $this->actingAs($user)->post('/api/v1/dashboard/images', [
        'file' => UploadedFile::fake()->image('ok.jpg', 800, 600),
        'section' => 'gallery',
    ], ['Accept' => 'application/json']);

    $response->assertOk();
    expect($response->json('data.url'))->toBeString();
});

it('rechaza imagen de galería mayor de 10 MB con mensaje en castellano', function () {
    /** @var TestCase $this */
    $user = dashboardImagesUser();

    $response = $this->actingAs($user)->post('/api/v1/dashboard/images', [
        'file' => UploadedFile::fake()->create('grande.jpg', 11000, 'image/jpeg'),
        'section' => 'gallery',
    ], ['Accept' => 'application/json']);

    $response->assertStatus(422);
    $body = $response->json();
    expect($body['errors']['file'][0])->toContain('10')
        ->and($body['errors']['file'][0])->not->toContain('validation.uploaded');
});

it('devuelve mensaje en español cuando la subida de galería falla en el servidor', function () {
    /** @var TestCase $this */
    $user = dashboardImagesUser();

    $base = UploadedFile::fake()->image('foto.jpg', 40, 40);
    $file = new class($base->getPathname(), $base->getClientOriginalName(), $base->getClientMimeType(), UPLOAD_ERR_PARTIAL, true) extends UploadedFile
    {
        public function isValid(): bool
        {
            return false;
        }
    };

    $response = $this->actingAs($user)->post('/api/v1/dashboard/images', [
        'file' => $file,
        'section' => 'gallery',
    ], ['Accept' => 'application/json']);

    $response->assertStatus(422);
    expect($response->json('errors.file.0'))->toBe(
        'La subida se interrumpió. Comprueba tu conexión e inténtalo de nuevo.',
    )->and($response->json('errors.file.0'))->not->toContain('validation.');
});

it('usa traducción en castellano para uploaded cuando locale es es', function () {
    app()->setLocale('es');

    expect(__('validation.uploaded', ['attribute' => 'archivo']))
        ->toContain('No se pudo completar la subida')
        ->not->toBe('validation.uploaded');
});
