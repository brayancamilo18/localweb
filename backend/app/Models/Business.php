<?php

namespace App\Models;

use App\Enums\Plan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Support\R2PublicUrl;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Multitenancy\Models\Tenant;

class Business extends Tenant
{
    use HasFactory, SoftDeletes;

    public const TEMPLATE_CHANGE_COOLDOWN_DAYS = 30;

    protected $fillable = [
        'name',
        'subdomain',
        'subdomain_type',
        'sector',
        'template_id',
        'template_changed_at',
        'logo_path',
        'favicon_path',
        'description',
        'tagline',
        'phone',
        'email',
        'address',
        'city',
        'country',
        'country_code',
        'lat',
        'lng',
        'schedule',
        'is_published',
        'plan',
        'plan_activated_at',
        'onboarding_completed_at',
        'dashboard_tour_completed_at',
        'dashboard_pro_tour_completed_at',
        'google_maps_url',
        'google_business_url',
        'booking_url',
        'vcard_enabled',
        'instagram_url',
        'tiktok_url',
        'facebook_url',
    ];

    protected function casts(): array
    {
        return [
            'template_changed_at' => 'datetime',
            'plan_activated_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
            'dashboard_tour_completed_at' => 'datetime',
            'dashboard_pro_tour_completed_at' => 'datetime',
            'schedule' => 'array',
            'lat' => 'float',
            'lng' => 'float',
            'is_published' => 'boolean',
            'vcard_enabled' => 'boolean',
            'deleted_at' => 'datetime',
            'plan' => Plan::class,
        ];
    }

    public function images(): HasMany
    {
        return $this->hasMany(BusinessImage::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(BusinessService::class)->orderBy('display_order');
    }

    public function owner(): HasOne
    {
        return $this->hasOne(User::class, 'business_id');
    }

    public function pageVisits(): HasMany
    {
        return $this->hasMany(PageVisit::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Fecha a partir de la cual el negocio puede volver a cambiar de plantilla.
     * Devuelve null si nunca ha cambiado (puede cambiar ya).
     */
    public function templateChangeAvailableAt(): ?\Illuminate\Support\Carbon
    {
        if ($this->template_changed_at === null) {
            return null;
        }

        return $this->template_changed_at->copy()->addDays(self::TEMPLATE_CHANGE_COOLDOWN_DAYS);
    }

    /**
     * ¿Está el negocio dentro del periodo de enfriamiento (no puede cambiar todavía)?
     */
    public function isTemplateChangeOnCooldown(): bool
    {
        $availableAt = $this->templateChangeAvailableAt();

        return $availableAt !== null && $availableAt->isFuture();
    }

    public function getWhatsAppUrlAttribute(): ?string
    {
        if (! $this->phone) {
            return null;
        }

        $phone = preg_replace('/\D+/', '', $this->phone);

        return $phone ? "https://wa.me/{$phone}" : null;
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        return R2PublicUrl::forPath($this->logo_path);
    }

    public function getFaviconUrlAttribute(): ?string
    {
        if (! $this->favicon_path) {
            return null;
        }

        return \App\Support\R2PublicUrl::forPath($this->favicon_path);
    }

    public function getFaviconTypeAttribute(): ?string
    {
        if (! $this->favicon_path) {
            return null;
        }

        $ext = strtolower(pathinfo($this->favicon_path, PATHINFO_EXTENSION));

        return match ($ext) {
            'png' => 'image/png',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',
            default => 'image/png',
        };
    }

    public function getIsFreeAttribute(): bool
    {
        return $this->plan === Plan::Free;
    }

    public function getIsProAttribute(): bool
    {
        return $this->plan === Plan::Pro;
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
