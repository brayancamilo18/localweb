<?php

return [
    // Interruptor general. Con false, todos los endpoints IA devuelven 503.
    'enabled' => env('AI_FEATURES_ENABLED', false),

    'provider'        => env('AI_PROVIDER', 'claude'),
    'claude_api_key'  => env('ANTHROPIC_API_KEY', ''),
    'model'           => env('AI_MODEL', 'claude-haiku-4-5'),
    'timeout_seconds' => (int) env('AI_TIMEOUT_SECONDS', 15),

    // Límite mensual global por usuario (todas las features suman contra este pool).
    'monthly_limit' => (int) env('AI_MONTHLY_LIMIT', 50),
];
