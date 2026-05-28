<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\SecurityEvent;
use App\Support\ParseUserAgent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SessionsController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;

        $sessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(fn ($session) => [
                'id' => substr($session->id, -6),
                'ip_address' => $session->ip_address,
                'user_agent_label' => ParseUserAgent::label($session->user_agent),
                'last_activity' => Carbon::createFromTimestamp((int) $session->last_activity)->toIso8601String(),
                'is_current' => $currentSessionId !== null && hash_equals($currentSessionId, $session->id),
            ])
            ->values()
            ->all();

        return $this->success(['sessions' => $sessions]);
    }

    public function destroyOthers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return $this->error(
                'La contraseña actual es incorrecta',
                ['current_password' => ['La contraseña actual es incorrecta']],
                422,
            );
        }

        if (! $request->hasSession()) {
            return $this->error('Sesión no disponible.', [], 500);
        }

        $currentSessionId = $request->session()->getId();

        $revoked = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $currentSessionId)
            ->delete();

        SecurityEvent::record($user, SecurityEvent::TYPE_SESSIONS_REVOKED, $request);

        return $this->success(['revoked' => $revoked]);
    }
}
