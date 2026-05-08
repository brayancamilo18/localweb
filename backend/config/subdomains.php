<?php

return [
    'reserved' => [
        'admin', 'api', 'www', 'mail', 'cdn', 'support', 'help',
        'blog', 'login', 'register', 'dashboard', 'onboarding',
        'app', 'static', 'assets', 'media', 'images', 'img',
        'docs', 'status', 'billing', 'stripe', 'webhook',
        'webhooks', 'auth', 'oauth', 'localweb', 'tenant',
        'tenants', 'public', 'private', 'test', 'staging',
        'dev', 'demo',
    ],
    'min_length' => 3,
    'max_length' => 63,
    // a-z, 0-9, hyphens; sin guion al principio/final, sin guiones dobles
    'pattern' => '/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/',
];
