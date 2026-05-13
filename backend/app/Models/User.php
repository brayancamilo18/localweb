<?php

namespace App\Models;

use App\Notifications\ResetPasswordEs;
use App\Notifications\VerifyEmailEs;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
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
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
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
