<?php

/**
 * Dominio base de las páginas públicas de negocio ({subdominio}.{domain}).
 *
 * Prioridad: PUBLIC_PAGE_DOMAIN → inferencia desde FRONTEND_URL → null (legacy APP_URL).
 */
$frontendHost = parse_url((string) env('FRONTEND_URL', ''), PHP_URL_HOST);

$inferredDomain = match ($frontendHost) {
    'app.onez.es', 'www.onez.es', 'onez.es' => 'onez.es',
    'pre.onez.es' => 'pre.onez.es',
    'des.onez.es' => 'des.onez.es',
    'app.localweb.es', 'localweb.es' => 'localweb.es',
    default => null,
};

return [
    'domain' => env('PUBLIC_PAGE_DOMAIN') ?: $inferredDomain,
    'scheme' => env('PUBLIC_PAGE_SCHEME', 'https'),
];
