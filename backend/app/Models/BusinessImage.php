<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use App\Support\R2PublicUrl;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessImage extends Model
{
    protected $fillable = [
        'business_id',
        'path',
        'section',
        'display_order',
        'width',
        'height',
        'focal_x',
        'focal_y',
    ];

    protected function casts(): array
    {
        return [
            'focal_x' => 'integer',
            'focal_y' => 'integer',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function getUrlAttribute(): string
    {
        return R2PublicUrl::forPath($this->path) ?? '';
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('display_order');
    }
}
