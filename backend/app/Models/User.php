<?php

namespace App\Models;

use App\Notifications\ResetPasswordEs;
use App\Notifications\VerifyEmailEs;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use RuntimeException;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use Billable, HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * `is_admin` no está aquí: usar `$user->forceFill(['is_admin' => ...])->save()` solo en seeds/comandos internos.
     *
     * @var list<string>
     */
    protected $fillable = [
        'business_id',
        'name',
        'email',
        'password',
        'marketing_consent_at',
        'terms_accepted_at',
        'terms_version',
        'privacy_policy_version',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'marketing_consent_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function referralsAsReferrer(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_user_id');
    }

    public function referralAsReferred(): HasOne
    {
        return $this->hasOne(Referral::class, 'referred_user_id');
    }

    public function ensureReferralCode(): string
    {
        if ($this->referral_code !== null && $this->referral_code !== '') {
            return $this->referral_code;
        }

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $code = Str::lower(Str::random(8));

            if (! static::query()->where('referral_code', $code)->exists()) {
                $this->forceFill(['referral_code' => $code])->save();

                return $code;
            }
        }

        throw new RuntimeException('No se pudo generar un código de referido único tras 5 intentos.');
    }

    public function getReferralLinkAttribute(): string
    {
        $base = rtrim((string) config('app.frontend_url'), '/');

        return $base.'/r/'.$this->ensureReferralCode();
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailEs);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordEs($token));
    }
}
