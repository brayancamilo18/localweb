<?php

namespace App\Models;

use App\Support\R2PublicUrl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessAboutSection extends Model
{
    protected $fillable = [
        'business_id',
        'display_order',
        'title',
        'description',
        'image_path',
    ];

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
