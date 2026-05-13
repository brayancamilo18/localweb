<?php

namespace App\Http\Controllers\Api\Public;

use App\Models\Business;
use App\Services\PublicPageUrlService;
use Symfony\Component\HttpFoundation\Response;

class VCardController
{
    public function __construct(
        private readonly PublicPageUrlService $urls,
    ) {}

    public function download(string $subdomain): Response
    {
        $business = Business::query()
            ->published()
            ->where('subdomain', $subdomain)
            ->with('owner')
            ->first();

        if (! $business) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (! $business->is_pro || ! $business->vcard_enabled) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $publicUrl = $this->urls->forBusiness($business);
        $body = $this->buildVcard($business, $publicUrl);

        $filename = preg_replace('/[^a-z0-9_-]+/i', '-', $business->subdomain).'.vcf';

        return response($body, 200, [
            'Content-Type' => 'text/vcard; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    private function buildVcard(Business $business, string $publicUrl): string
    {
        $lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'FN:'.$this->escapeVcard($business->name),
            'ORG:'.$this->escapeVcard($business->name),
        ];

        if ($business->phone) {
            $tel = preg_replace('/\s+/', '', (string) $business->phone);
            if ($tel !== '') {
                $lines[] = 'TEL;TYPE=CELL:'.$this->escapeVcard($tel);
            }
        }

        if ($business->address) {
            $lines[] = 'ADR;TYPE=WORK:;;'.$this->escapeVcard((string) $business->address).';;;;';
        }

        $email = $business->owner?->email;
        if ($email) {
            $lines[] = 'EMAIL;TYPE=INTERNET:'.$this->escapeVcard($email);
        }

        $lines[] = 'URL:'.$this->escapeVcard($publicUrl);
        $lines[] = 'END:VCARD';

        return implode("\r\n", $lines)."\r\n";
    }

    private function escapeVcard(string $value): string
    {
        return str_replace(
            ['\\', ',', ';', "\n", "\r"],
            ['\\\\', '\\,', '\\;', '\\n', ''],
            $value
        );
    }
}
