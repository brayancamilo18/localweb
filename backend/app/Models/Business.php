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

    protected $fillable = [
        'name',
        'subdomain',
        'subdomain_type',
        'sector',
        'template_id',
        'logo_path',
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
            'plan_activated_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
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
