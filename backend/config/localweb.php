<?php

return [
    'default_social' => [
        'instagram' => env('LOCALWEB_DEFAULT_INSTAGRAM', 'https://www.instagram.com/localweb.es'),
        'tiktok' => env('LOCALWEB_DEFAULT_TIKTOK', 'https://www.tiktok.com/@localweb'),
        'facebook' => env('LOCALWEB_DEFAULT_FACEBOOK', 'https://www.facebook.com/localweb'),
    ],

    'domains' => [
        // Dominio raíz del SPA / app principal. Sin protocolo, sin slash final.
        // En producción: app.onez.es
        // En local: localhost
        'root' => env('LOCALWEB_ROOT_DOMAIN', 'localhost'),

        // Sufijo de subdominio de tenant. Sin punto inicial.
        // En producción: app.onez.es  (kairos.app.onez.es → tenant = kairos)
        // En local: localhost          (en local no hay wildcard DNS, se usa X-Tenant header o query param)
        'tenant_suffix' => env('LOCALWEB_TENANT_SUFFIX', 'localhost'),
    ],

    'seo' => [
        // Imagen OG por defecto cuando el negocio no tiene portada.
        // Debe ser una URL absoluta. En producción apuntará a un asset en R2/CDN.
        // Por ahora apunta a un placeholder que crearemos como archivo estático.
        'default_og_image' => env(
            'LOCALWEB_DEFAULT_OG_IMAGE',
            'https://'.env('LOCALWEB_ROOT_DOMAIN', 'localhost').'/og-default.png'
        ),

        // Nombre de la plataforma, para el sufijo del title.
        'site_name' => env('LOCALWEB_SITE_NAME', 'app.onez.es'),

        // Separador del title (entre nombre negocio y site_name).
        'title_separator' => '·',
    ],
];
