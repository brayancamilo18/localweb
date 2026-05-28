<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\SecurityEvent;
use App\Support\ParseUserAgent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityEventsController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $events = SecurityEvent::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (SecurityEvent $event) => [
                'type' => $event->type,
                'ip_address' => $event->ip_address,
                'user_agent_label' => ParseUserAgent::label($event->user_agent),
                'created_at' => $event->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return $this->success(['events' => $events]);
    }
}
