<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SubdomainRulesController extends BaseApiController
{
    public function __invoke(): JsonResponse
    {
        $payload = Cache::remember('public:subdomain-rules', now()->addHour(), fn () => [
            'reserved' => array_values((array) config('subdomains.reserved', [])),
            'min_length' => (int) config('subdomains.min_length', 3),
            'max_length' => (int) config('subdomains.max_length', 63),
            'pattern' => (string) config('subdomains.pattern', '/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/'),
        ]);

        return $this->success($payload);
    }
}
