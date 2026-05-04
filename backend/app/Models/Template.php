<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'primary_color',
        'is_active',
        'requires_pro',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'requires_pro' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
