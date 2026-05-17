<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('serves business images through the media proxy', function () {
    Storage::fake('r2');
    Storage::disk('r2')->put('businesses/1/cover/test.webp', 'fake-webp-bytes', [
        'visibility' => 'public',
        'ContentType' => 'image/webp',
    ]);

    test()->get('/api/v1/media/businesses/1/cover/test.webp')
        ->assertOk()
        ->assertHeader('Content-Type', 'image/webp');
});

it('returns 404 for disallowed media paths', function () {
    test()->get('/api/v1/media/secret/file.webp')
        ->assertNotFound();
});
