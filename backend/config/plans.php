<?php

return [
    'free' => [
        'max_photos' => 3,
        'analytics' => false,
        'analytics_days' => 0,
        'can_choose_subdomain' => false,
        'remove_branding' => false,
        'custom_domain' => false,
    ],
    'pro' => [
        'max_photos' => 20,
        'analytics' => true,
        'analytics_days' => 90,
        'can_choose_subdomain' => true,
        'remove_branding' => true,
        'custom_domain' => true,
    ],
];
