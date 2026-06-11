<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGeneration extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'business_id',
        'feature',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $model) => $model->created_at = now());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
