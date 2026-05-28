<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SecurityEvent extends Model
{
    public const TYPE_LOGIN = 'login';

    public const TYPE_PASSWORD_CHANGED = 'password_changed';

    public const TYPE_EMAIL_CHANGED = 'email_changed';

    public const TYPE_SESSIONS_REVOKED = 'sessions_revoked';

    public const TYPE_ACCOUNT_DELETED = 'account_deleted';

    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'type',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(User $user, string $type, Request $request): void
    {
        try {
            static::create([
                'user_id' => $user->id,
                'type' => $type,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Security event recording failed', [
                'user_id' => $user->id,
                'type' => $type,
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
