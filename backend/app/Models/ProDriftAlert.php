<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProDriftAlert extends Model
{
    protected $fillable = [
        'business_id',
        'user_id',
        'stripe_customer_id',
        'plan_value',
        'drift_type',
        'subscription_status',
        'plan_activated_at',
        'detected_at',
        'resolved_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'plan_activated_at' => 'datetime',
            'detected_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('resolved_at');
    }
}
