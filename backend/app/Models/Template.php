<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'primary_color',
        'is_active',
        'requires_pro',
        'hero_photo_slots',
        'thumbnail_url',
        'thumbnail_status',
        'thumbnail_generated_at',
        'category',
        'suitable_sectors',
        'sort_order',
        'featured',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'requires_pro' => 'boolean',
            'hero_photo_slots' => 'integer',
            'suitable_sectors' => 'array',
            'sort_order' => 'integer',
            'featured' => 'boolean',
            'thumbnail_generated_at' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }

    public function businesses(): HasMany
    {
        return $this->hasMany(Business::class);
    }
}
