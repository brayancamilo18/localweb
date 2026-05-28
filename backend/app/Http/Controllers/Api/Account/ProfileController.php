<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Models\SecurityEvent;
use App\Notifications\EmailChangedEs;
use App\Notifications\PasswordChangedEs;
use App\Support\MaskEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Endpoints de cuenta del usuario autenticado (datos personales + cambio de
 * contraseña). Todo va detrás de `auth:sanctum` (ver `routes/api.php`); estos
 * endpoints NO requieren tener el email verificado, porque precisamente se
 * usan también para cambiar el email cuando el actual ya no es accesible.
 */
class ProfileController extends BaseApiController
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('business');

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ],
            'business_name' => $user->business?->name,
        ]);
    }

    /**
     * Actualiza nombre y/o email. Si el email cambia se invalida la verificación
     * (`email_verified_at = null`) y se reenvía la notificación de verificación
     * en castellano (`VerifyEmailEs`), igual que en el flujo de registro.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        unset($data['current_password']);

        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;

        if ($emailChanged) {
            if (! Hash::check($request->input('current_password'), $user->password)) {
                return $this->error(
                    'La contraseña actual es incorrecta',
                    ['current_password' => ['La contraseña actual es incorrecta']],
                    422,
                );
            }

            $previousEmail = $user->email;
            $changedAt = now();

            try {
                Notification::route('mail', $previousEmail)
                    ->notify(new EmailChangedEs(
                        accountName: $user->name ?: '',
                        previousEmail: $previousEmail,
                        newEmailMasked: MaskEmail::partial($data['email']),
                        requestIp: $request->ip() ?? 'No disponible',
                        changedAt: $changedAt,
                    ));
            } catch (\Throwable $e) {
                Log::error('Email changed security notification failed', [
                    'user_id' => $user->id,
                    'previous_email' => $previousEmail,
                    'exception' => $e->getMessage(),
                ]);
            }

            $user->email_verified_at = null;

            SecurityEvent::record($user, SecurityEvent::TYPE_EMAIL_CHANGED, $request);
        }
        $user->fill($data)->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        $user->load('business');

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ],
            'business_name' => $user->business?->name,
            'email_changed' => $emailChanged,
        ]);
    }

    /**
     * Cambia la contraseña tras revalidar la actual con `Hash::check`.
     *
     * Nota: el modelo `User` declara el cast `'password' => 'hashed'`, que
     * detecta si el valor entrante ya parece bcrypt y no lo re-hashea, así
     * que `Hash::make(...)` aquí sigue siendo seguro (no produce doble hash).
     */
    public function password(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return $this->error(
                'La contraseña actual es incorrecta',
                ['current_password' => ['La contraseña actual es incorrecta']],
                422,
            );
        }

        $user->password = Hash::make($request->input('password'));
        $user->save();

        try {
            $user->notify(new PasswordChangedEs(
                requestIp: $request->ip() ?? 'No disponible',
                changedAt: now(),
            ));
        } catch (\Throwable $e) {
            Log::error('Password changed security email failed', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }

        SecurityEvent::record($user, SecurityEvent::TYPE_PASSWORD_CHANGED, $request);

        return $this->success(['message' => 'Contraseña actualizada']);
    }
}
