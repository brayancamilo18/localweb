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
        $domain = config('public_page.domain');
        if (is_string($domain) && $domain !== '') {
            $scheme = (string) config('public_page.scheme', 'https');

            return "{$scheme}://{$subdomain}.{$domain}";
        }

        $base = rtrim((string) config('app.url'), '/');
        $parts = parse_url($base) ?: [];
        $scheme = $parts['scheme'] ?? 'http';
        $host = $parts['host'] ?? 'localhost';
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return "{$scheme}://{$subdomain}.{$host}{$port}";
    }
}
