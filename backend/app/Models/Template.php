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
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'requires_pro' => 'boolean',
            'hero_photo_slots' => 'integer',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function businesses(): HasMany
    {
        return $this->hasMany(Business::class);
    }
}
