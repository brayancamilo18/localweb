<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeleteAccountRequest extends FormRequest
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
            'confirmation' => ['required', 'string', Rule::in(['ELIMINAR'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'La contraseña actual es obligatoria',
            'confirmation.required' => 'Debes escribir ELIMINAR para confirmar',
            'confirmation.in' => 'Escribe exactamente ELIMINAR para confirmar la eliminación',
        ];
    }
}
