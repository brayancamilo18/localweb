<?php

use App\Http\Controllers\StripeWebhookController;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Cashier\Http\Controllers\PaymentController;

Route::get('/', function () {
    return view('welcome');
})->name('home');

// Verificación de email a través del link firmado del correo. NO requiere sesión activa
// (el usuario puede hacer click desde otro dispositivo). La firma y el hash del email
// son las dos protecciones; coincide con el comportamiento de Illuminate\Foundation\Auth\EmailVerificationRequest
// pero sin depender de auth().
Route::get('/email/verify/{id}/{hash}', function (Request $request, string $id, string $hash) {
    $user = User::find($id);

    if (! $user) {
        abort(404);
    }

    if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        abort(403);
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/');
})->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

Route::prefix(config('cashier.path', 'stripe'))->name('cashier.')->group(function (): void {
    Route::get('payment/{id}', [PaymentController::class, 'show'])->name('payment');
    Route::post('webhook', [StripeWebhookController::class, 'handleWebhook'])->name('webhook');
});
