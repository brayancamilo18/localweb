<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Comprueba fallos de subida antes de la validación de Laravel (evita claves
 * crudas como validation.uploaded cuando PHP/nginx descartan el body).
 */
final class DashboardUploadGuard
{
    /**
     * @throws ValidationException
     */
    public static function ensureFileReceived(Request $request, int $maxKilobytes, string $field = 'file'): void
    {
        if (self::phpDiscardedUpload($request, $field)) {
            throw ValidationException::withMessages([
                $field => [self::maxSizeMessage($maxKilobytes)],
            ]);
        }
    }

    public static function phpDiscardedUpload(Request $request, string $field = 'file'): bool
    {
        if ($request->hasFile($field)) {
            return false;
        }

        if (empty($_FILES)) {
            return false;
        }

        $entry = $_FILES[$field] ?? null;

        if (! is_array($entry)) {
            return ! empty($_FILES);
        }

        $error = (int) ($entry['error'] ?? UPLOAD_ERR_NO_FILE);

        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            return true;
        }

        $name = $entry['name'] ?? '';
        $tmpName = $entry['tmp_name'] ?? '';

        if ($name !== '' && $name !== 'none' && ($tmpName === '' || $error !== UPLOAD_ERR_OK)) {
            return true;
        }

        return false;
    }

    public static function maxSizeMessage(int $maxKilobytes): string
    {
        $mb = self::formatMegabytesFromKilobytes($maxKilobytes);

        return "La imagen es demasiado grande. El tamaño máximo es {$mb} MB.";
    }

    public static function formatMegabytesFromKilobytes(int $maxKilobytes): string
    {
        $mb = $maxKilobytes / 1024;

        return rtrim(rtrim(number_format($mb, 1, '.', ''), '0'), '.') ?: '0';
    }

    public static function maxSizeExceededResponse(int $maxKilobytes, string $field = 'file'): JsonResponse
    {
        $message = self::maxSizeMessage($maxKilobytes);

        return response()->json([
            'message' => $message,
            'errors' => [$field => [$message]],
        ], 422);
    }
}
