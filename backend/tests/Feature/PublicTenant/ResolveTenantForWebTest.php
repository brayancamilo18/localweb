<?php

use App\Http\Middleware\ResolveTenantForWeb;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

it('ignores X-Tenant-Subdomain header in production and resolves tenant from host', function () {
    config([
        'app.env' => 'production',
        'localweb.domains.tenant_suffix' => 'app.onez.es',
        'localweb.domains.root' => 'app.onez.es',
    ]);

    createPublishedBusiness(['subdomain' => 'foo']);
    createPublishedBusiness(['subdomain' => 'otro-tenant']);

    $request = Request::create('https://foo.app.onez.es/', 'GET');
    $request->headers->set('X-Tenant-Subdomain', 'otro-tenant');

    $resolved = null;
    app(ResolveTenantForWeb::class)->handle($request, function (Request $req) use (&$resolved) {
        $resolved = $req->attributes->get('tenant_business');

        return response('ok');
    });

    expect($resolved)->not->toBeNull()
        ->and($resolved->subdomain)->toBe('foo');
});
