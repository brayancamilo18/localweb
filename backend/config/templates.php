<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Miniaturas de plantillas (capturas del hero)
    |--------------------------------------------------------------------------
    |
    | Las miniaturas se generan con Browsershot (Puppeteer + Chromium) navegando
    | a la plantilla estática servida en {base_url}/templates/{slug}.html, se
    | codifican a webp y se suben a R2. La ruta R2 se guarda en templates.thumbnail_url.
    |
    */

    'thumbnails' => [
        // Host desde el que se sirven los HTML de plantilla (frontend). En el VPS
        // coincide con APP_URL (app.onez.es); en local con el dev server / preview.
        'base_url' => rtrim((string) env('TEMPLATE_THUMBNAIL_BASE_URL', env('APP_URL', 'http://localhost')), '/'),

        // Prefijo de objeto en R2.
        'disk' => env('TEMPLATE_THUMBNAIL_DISK', 'r2'),
        'path_prefix' => 'templates',

        // Viewport de captura (coincide con el script local generate-template-thumbs.mjs).
        'width' => (int) env('TEMPLATE_THUMBNAIL_WIDTH', 1280),
        'height' => (int) env('TEMPLATE_THUMBNAIL_HEIGHT', 760),
        'webp_quality' => (int) env('TEMPLATE_THUMBNAIL_QUALITY', 80),

        // Margen tras `load` para que el hero termine de pintar (animaciones / imágenes remotas).
        'settle_ms' => (int) env('TEMPLATE_THUMBNAIL_SETTLE_MS', 1800),
        'timeout_s' => (int) env('TEMPLATE_THUMBNAIL_TIMEOUT', 60),

        // Binarios y resolución de módulos Node para Browsershot. Vacío => autodetección.
        'node_binary' => env('BROWSERSHOT_NODE_BINARY'),
        'npm_binary' => env('BROWSERSHOT_NPM_BINARY'),
        // Ruta a node_modules donde está instalado puppeteer (por defecto el del backend).
        'node_module_path' => env('BROWSERSHOT_NODE_MODULE_PATH', base_path('node_modules')),
        // Chromium del sistema (opcional). Si se define, evita usar el de puppeteer.
        'chrome_path' => env('BROWSERSHOT_CHROME_PATH'),

        // Flags extra para Chromium en servidores headless (sandbox de contenedor).
        'no_sandbox' => (bool) env('BROWSERSHOT_NO_SANDBOX', true),
    ],

];
