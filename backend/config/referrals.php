<?php

return [
    'reward_threshold' => (int) env('REFERRAL_REWARD_THRESHOLD', 1),
    'max_referrals' => (int) env('REFERRAL_MAX_PER_USER', 5),
    'template_gift_at' => (int) env('REFERRAL_TEMPLATE_GIFT_AT', 5),
    'admin_notify_email' => env('REFERRAL_ADMIN_NOTIFY_EMAIL'),
    // Cupón aplicado al referido al pagar su primera factura (mes gratis)
    'ref_coupon_id' => env('STRIPE_COUPON_REF_FIRST_FREE'),
    // Cupón aplicado al referidor como premio cuando un referido paga
    'reward_coupon_id' => env('STRIPE_COUPON_REFERRER_REWARD'),
];
