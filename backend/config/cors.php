<?php

$defaultOrigins = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173';

$rawOrigins = env('CORS_ALLOWED_ORIGINS');
if (! is_string($rawOrigins) || trim($rawOrigins) === '') {
    $rawOrigins = $defaultOrigins;
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(trim(...), explode(',', $rawOrigins)))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => ['Authorization'],

    'max_age' => 0,

    'supports_credentials' => true,
];
