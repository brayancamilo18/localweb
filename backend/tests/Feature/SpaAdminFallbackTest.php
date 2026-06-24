<?php

use Illuminate\Support\Facades\File;

it('serves the SPA index for admin deep links when the dist file exists', function () {
    $index = storage_path('framework/testing-spa-index.html');
    File::put($index, '<!doctype html><html><body>spa</body></html>');

    config(['app.frontend_dist_index' => $index]);

    $this->get('/admin/businesses')
        ->assertOk()
        ->assertHeader('content-type', 'text/html; charset=UTF-8');

    File::delete($index);
});

it('does not expose filament at /admin anymore', function () {
    $this->get('/admin/login')->assertNotFound();
});

it('keeps filament under /filament/login', function () {
    $this->get('/filament/login')->assertOk();
});
