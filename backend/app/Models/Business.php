<?php

namespace App\Models;

use App\Enums\Plan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
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
        'address',
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

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('r2');

            return $disk->url($this->logo_path);
        } catch (\Throwable) {
            return null;
        }
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
