<?php

namespace App\Models;

use App\Support\R2PublicUrl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessEvent extends Model
{
    protected $fillable = [
        'business_id',
        'title',
        'event_date',
        'location',
        'description',
        'image_path',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        return R2PublicUrl::forPath($this->image_path);
    }
}
