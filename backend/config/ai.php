<?php

return [
    // Interruptor general. Con false, todos los endpoints IA devuelven 503.
    'enabled' => env('AI_FEATURES_ENABLED', false),

    'provider' => env('AI_PROVIDER', 'claude'),
    'claude_api_key' => env('ANTHROPIC_API_KEY', ''),
    'model' => env('AI_MODEL', 'claude-haiku-4-5'),
    'timeout_seconds' => (int) env('AI_TIMEOUT_SECONDS', 15),

    // Límites diarios por feature y por usuario (día natural Europe/Madrid).
    'daily_limits' => [
        'business_description' => (int) env('AI_LIMIT_BUSINESS_DESCRIPTION', 5),
        'service_description' => (int) env('AI_LIMIT_SERVICE_DESCRIPTION', 10),
        'improve_text' => (int) env('AI_LIMIT_IMPROVE_TEXT', 10),
        'social_posts' => (int) env('AI_LIMIT_SOCIAL_POSTS', 5),
        'seo_meta' => (int) env('AI_LIMIT_SEO_META', 3),
    ],
];
