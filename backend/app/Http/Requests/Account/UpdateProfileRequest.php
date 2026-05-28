<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validación del PATCH /v1/account/profile.
 *
 * Solo `name` y `email` son editables: el password vive en su propio request
 * (`UpdatePasswordRequest`) porque exige confirmación + contraseña actual.
 * Cualquier otra columna de `users` (p. ej. `is_admin`) se omite a propósito.
 */
class UpdateProfileRequest extends FormRequest
{
    /**
     * El propio middleware `auth:sanctum` ya garantiza que el usuario está
     * autenticado y solo puede tocar su propio registro.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                /** Permite reenviar el mismo email del usuario sin chocar con la
                 * regla unique (caso típico de un PATCH que solo cambia el nombre
                 * pero envía todos los campos del formulario). */
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            // Solo obligatoria cuando el email entrante difiere del actual.
            // La comprobación criptográfica (Hash::check) va en el controlador,
            // igual que en UpdatePasswordRequest → ProfileController::password.
            'current_password' => [
                Rule::requiredIf(fn () => $this->filled('email') && $this->input('email') !== $user->email),
                'string',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.min' => 'El nombre debe tener al menos 2 caracteres',
            'name.max' => 'El nombre no puede superar los 100 caracteres',
            'email.email' => 'Email inválido',
            'email.unique' => 'Ese email ya está en uso',
            'current_password.required' => 'La contraseña actual es obligatoria para cambiar el email',
        ];
    }
}
