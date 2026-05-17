<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Plantilla HTML pública del negocio.
 *
 * Thumbnails del grid (paso 1 onboarding): campo opcional `thumbnail_url` (PNG/WebP ~600×450).
 * Generación sugerida (otro PR): comando Artisan con Playwright/Puppeteer o servicio
 * tipo Urlbox al crear/actualizar la plantilla; guardar la URL en storage/CDN.
 * Mientras no exista thumbnail, el front usa iframe lazy con pool (ver TemplateCardPreview).
 */
class Template extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'primary_color',
        'thumbnail_url',
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
