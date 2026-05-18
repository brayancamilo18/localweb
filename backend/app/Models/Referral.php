<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referral extends Model
{
    public const STATUS_REGISTERED = 'registered';

    public const STATUS_PAID = 'paid';

    public const STATUS_REWARDED = 'rewarded';

    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'referrer_user_id',
        'referred_user_id',
        'referred_email',
        'status',
        'first_payment_at',
        'rewarded_at',
        'stripe_invoice_id',
    ];

    protected function casts(): array
    {
        return [
            'first_payment_at' => 'datetime',
            'rewarded_at' => 'datetime',
        ];
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }
}
