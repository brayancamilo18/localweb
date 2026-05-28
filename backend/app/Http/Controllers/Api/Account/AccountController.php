<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Account\DeleteAccountRequest;
use App\Models\SecurityEvent;
use App\Notifications\AccountDeletedEs;
use App\Services\AccountDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\HttpFoundation\Response;

class AccountController extends BaseApiController
{
    /**
     * Supresión de cuenta (soft-delete + anonimización). Requiere contraseña
     * actual y confirmación explícita «ELIMINAR». Cancela Stripe antes de tocar BD.
     */
    public function destroy(DeleteAccountRequest $request, AccountDeletionService $deletion): JsonResponse|Response
    {
        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return $this->error(
                'La contraseña actual es incorrecta',
                ['current_password' => ['La contraseña actual es incorrecta']],
                422,
            );
        }

        $previousEmail = $user->email;
        $accountName = $user->name ?: '';

        try {
            $deletion->cancelStripeSubscription($user);
        } catch (\Throwable $e) {
            Log::error('Account deletion aborted: Stripe subscription cancel failed', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);

            return $this->error(
                'No se pudo cancelar la suscripción. Inténtalo de nuevo o contacta con soporte.',
                [],
                503,
            );
        }

        SecurityEvent::record($user, SecurityEvent::TYPE_ACCOUNT_DELETED, $request);

        try {
            Notification::route('mail', $previousEmail)
                ->notify(new AccountDeletedEs(
                    accountName: $accountName,
                    requestIp: $request->ip() ?? 'No disponible',
                    deletedAt: now(),
                ));
        } catch (\Throwable $e) {
            Log::error('Account deleted confirmation email failed', [
                'user_id' => $user->id,
                'previous_email' => $previousEmail,
                'exception' => $e->getMessage(),
            ]);
        }

        $deletion->anonymizeAndDelete($user);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
