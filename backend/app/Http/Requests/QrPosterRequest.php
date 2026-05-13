<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QrPosterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'size' => ['sometimes', Rule::in(['a4', 'a5', 'square'])],
            'message' => ['sometimes', 'string', 'max:80'],
            'include_logo' => ['sometimes', 'boolean'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            // ~1.5MB base64 — el frontend manda el logo ya convertido para
            // que dompdf no tenga que hacer un fetch HTTP externo.
            'logo_data_uri' => ['sometimes', 'nullable', 'string', 'max:2000000'],
        ];
    }

    public function messages(): array
    {
        return [
            'size.in' => 'Tamaño no válido',
            'message.max' => 'El mensaje no puede superar los 80 caracteres',
            'color.regex' => 'Color no válido (usa formato #RRGGBB)',
        ];
    }

    /**
     * Devuelve las opciones validadas. `color` y `include_logo` quedan como null si no
     * vinieron, para que el controlador pueda aplicar los defaults heredados del negocio.
     */
    public function options(): array
    {
        $v = $this->validated();

        return [
            'size' => $v['size'] ?? 'a4',
            'message' => $v['message'] ?? '¡Escanéame!',
            'include_logo' => array_key_exists('include_logo', $v) ? (bool) $v['include_logo'] : null,
            'color' => $v['color'] ?? null,
        ];
    }
}
