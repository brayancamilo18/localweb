<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows CORS preflight for track from tenant subdomain origin', function () {
    $business = createPublishedBusinessForTrack('loki-cors-'.uniqid());

    test()
        ->options('/api/v1/public/'.$business->subdomain.'/track', [], [
            'Origin' => 'http://loki.localhost',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type',
        ])
        ->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://loki.localhost');
});

it('allows track POST with Origin from tenant subdomain', function () {
    $business = createPublishedBusinessForTrack('loki-post-'.uniqid());

    test()
        ->postJson('/api/v1/public/'.$business->subdomain.'/track', [
            'type' => 'whatsapp_click',
        ], [
            'Origin' => 'http://loki.localhost',
        ])
        ->assertOk()
        ->assertHeader('Access-Control-Allow-Origin', 'http://loki.localhost');
});
