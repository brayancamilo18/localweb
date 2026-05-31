<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class ResetPasswordController extends BaseApiController
{
    /**
     * Restablece la contraseña con un token válido enviado por correo.
     *
     * El cast 'hashed' del modelo `User` se encarga de hashear el password
     * al guardarlo, por lo que aquí guardamos el valor en claro vía
     * `forceFill(['password' => $password])`. Llamar a `Hash::make()` aquí
     * provocaría un doble hash.
     *
     * Tras un reset correcto NO iniciamos sesión: el usuario vuelve al login
     * y entra con la nueva contraseña. Así evitamos sesiones colgadas si el
     * reset se hizo desde otro dispositivo.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'token.required' => 'El enlace de recuperación es inválido. Vuelve a solicitarlo.',
            'email.required' => 'Introduce tu correo electrónico.',
            'email.email' => 'Introduce un correo electrónico válido.',
            'password.required' => 'Introduce una nueva contraseña.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->success(null, 'Contraseña actualizada.');
        }

        if ($status === Password::INVALID_TOKEN) {
            return $this->error(
                'El enlace de recuperación no es válido o ha caducado.',
                ['token' => ['Token inválido o caducado.']],
                422
            );
        }

        if ($status === Password::INVALID_USER) {
            return $this->error(
                'No encontramos una cuenta con ese correo.',
                ['email' => ['Correo no registrado.']],
                422
            );
        }

        return $this->error('No se pudo restablecer la contraseña.', [], 422);
    }
}
