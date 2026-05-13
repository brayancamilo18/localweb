<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validación del POST /v1/account/password.
 *
 * Reglas:
 * - `current_password`: la pide el controller para verificar la sesión activa
 *   antes de permitir el cambio (defensa contra session hijacking).
 * - `password`: nueva contraseña, mínimo 8 caracteres y `confirmed` (espera
 *   también `password_confirmation`). `different:current_password` evita el
 *   rotar a la misma contraseña por error.
 */
class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'La contraseña actual es obligatoria',
            'password.required' => 'La nueva contraseña es obligatoria',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres',
            'password.confirmed' => 'La confirmación no coincide',
            'password.different' => 'La nueva contraseña debe ser distinta de la actual',
        ];
    }
}
