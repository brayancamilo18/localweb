<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class ForgotPasswordController extends BaseApiController
{
    /**
     * Envía un correo con el enlace de recuperación de contraseña.
     *
     * Por seguridad, la respuesta es idéntica exista o no el email en la base
     * de datos: así no filtramos qué correos están registrados (enumeración).
     * El único error explícito es el throttle del propio password broker, que
     * sí devolvemos como 429 para que el SPA pueda mostrar un aviso útil al
     * usuario que ya pidió un correo hace muy poco.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Introduce tu correo electrónico.',
            'email.email' => 'Introduce un correo electrónico válido.',
        ]);

        $status = Password::broker()->sendResetLink(['email' => $data['email']]);

        if ($status === Password::RESET_THROTTLED) {
            return $this->error('Espera unos minutos antes de pedir otro correo.', [], 429);
        }

        return $this->success(
            null,
            'Si el correo existe, hemos enviado instrucciones para restablecer la contraseña.'
        );
    }
}
