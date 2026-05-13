<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;

        if ($emailChanged) {
            $user->email_verified_at = null;
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

        return $this->success(['message' => 'Contraseña actualizada']);
    }
}
