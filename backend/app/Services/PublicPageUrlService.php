<?php

namespace App\Services;

use App\Models\Business;

class PublicPageUrlService
{
    public function forBusiness(Business $business): string
    {
        return $this->forSubdomain($business->subdomain);
    }

    public function forSubdomain(string $subdomain): string
    {
        $base = rtrim((string) config('app.url'), '/');
        $parts = parse_url($base) ?: [];
        $scheme = $parts['scheme'] ?? 'http';
        $host = $parts['host'] ?? 'localhost';
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return "{$scheme}://{$subdomain}.{$host}{$port}";
    }
}
