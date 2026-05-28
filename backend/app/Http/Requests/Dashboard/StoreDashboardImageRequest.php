<?php

namespace App\Http\Requests\Dashboard;

use App\Support\DashboardUploadGuard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class StoreDashboardImageRequest extends FormRequest
{
    public const MAX_FILE_KILOBYTES = 10240;

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
            'file' => ['required', 'file', 'image', 'max:'.self::MAX_FILE_KILOBYTES],
            'section' => ['required', 'in:cover,gallery,about'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Selecciona una imagen para subir.',
            'file.file' => 'El archivo no es válido.',
            'file.image' => 'Solo se permiten imágenes (JPG, PNG, WebP, etc.).',
            'file.max' => 'La imagen no puede superar 10 MB.',
            'file.uploaded' => 'No se pudo recibir la imagen. Suele deberse a una conexión inestable o a un archivo demasiado pesado. Vuelve a intentarlo.',
            'section.required' => 'Indica en qué sección va la imagen.',
            'section.in' => 'La sección indicada no es válida.',
        ];
    }

    public function validateResolved(): void
    {
        DashboardUploadGuard::ensureFileReceived($this, self::MAX_FILE_KILOBYTES);

        $file = $this->file('file');

        if ($file instanceof UploadedFile && ! $file->isValid()) {
            throw ValidationException::withMessages([
                'file' => [$this->uploadFailureMessage($file)],
            ]);
        }

        parent::validateResolved();
    }

    private function uploadFailureMessage(UploadedFile $file): string
    {
        return match ($file->getError()) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => DashboardUploadGuard::maxSizeMessage(self::MAX_FILE_KILOBYTES),
            UPLOAD_ERR_PARTIAL => 'La subida se interrumpió. Comprueba tu conexión e inténtalo de nuevo.',
            UPLOAD_ERR_NO_FILE => 'No se recibió ningún archivo. Vuelve a seleccionar la imagen.',
            default => 'No se pudo recibir la imagen. Vuelve a intentarlo.',
        };
    }
}
