<?php

namespace App\Http\Controllers;

use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PublicSitemapController extends Controller
{
    public function tenant(Request $request): Response
    {
        $business = $request->attributes->get('tenant_business');

        if ($business === null) {
            abort(404);
        }

        $cacheKey = 'sitemap:tenant:'.$business->subdomain;
        $cached = Cache::get($cacheKey);

        if ($cached) {
            return $this->xmlResponse($cached);
        }

        $content = $this->buildTenantSitemap($business);
        Cache::put($cacheKey, $content, 3600);

        return $this->xmlResponse($content);
    }

    public function master(Request $request): Response
    {
        $cacheKey = 'sitemap:master';
        $cached = Cache::get($cacheKey);

        if ($cached) {
            return $this->xmlResponse($cached);
        }

        $content = $this->buildMasterSitemap();
        Cache::put($cacheKey, $content, 1800);

        return $this->xmlResponse($content);
    }

    private function buildMasterSitemap(): string
    {
        $tenantSuffix = config('localweb.domains.tenant_suffix');

        $query = Business::query()
            ->where('is_published', true)
            ->whereNull('deleted_at')
            ->orderByDesc('updated_at')
            ->select(['subdomain', 'updated_at']);

        $total = $query->count();

        if ($total > 49000) {
            Log::warning('Master sitemap exceeds 49000 entries. Implement sitemap index pagination.', [
                'total_published' => $total,
            ]);
            // FIXME: implementar paginación de sitemap-índice cuando total > 49000
        }

        $businesses = $query->limit(49000)->get();

        $entries = '';

        foreach ($businesses as $business) {
            $loc = htmlspecialchars(
                'https://'.$business->subdomain.'.'.$tenantSuffix.'/sitemap.xml',
                ENT_XML1 | ENT_QUOTES,
                'UTF-8'
            );
            $lastmod = $business->updated_at->toDateString();
            $entries .= "  <sitemap>\n";
            $entries .= "    <loc>{$loc}</loc>\n";
            $entries .= "    <lastmod>{$lastmod}</lastmod>\n";
            $entries .= "  </sitemap>\n";
        }

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{$entries}</sitemapindex>
XML;
    }

    private function buildTenantSitemap(Business $business): string
    {
        $loc = 'https://'.$business->subdomain.'.'.config('localweb.domains.tenant_suffix').'/';
        $lastmod = $business->updated_at->toDateString();
        $name = htmlspecialchars((string) $business->name, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        $imageTags = '';

        if ($business->relationLoaded('images') && $business->images->isNotEmpty()) {
            $count = 0;

            foreach ($business->images->sortBy('display_order') as $img) {
                if (! in_array($img->section, ['cover', 'gallery'], true)) {
                    continue;
                }

                $url = $img->url;
                if (! is_string($url) || trim($url) === '') {
                    continue;
                }

                $imageTags .= '    <image:image>'.PHP_EOL;
                $imageTags .= '      <image:loc>'.htmlspecialchars($url, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</image:loc>'.PHP_EOL;
                $imageTags .= '      <image:title>'.$name.'</image:title>'.PHP_EOL;
                $imageTags .= '    </image:image>'.PHP_EOL;

                $count++;
                if ($count >= 10) {
                    break;
                }
            }
        }

        return '<?xml version="1.0" encoding="UTF-8"?>'.PHP_EOL
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'.PHP_EOL
            .'        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'.PHP_EOL
            .'  <url>'.PHP_EOL
            .'    <loc>'.htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</loc>'.PHP_EOL
            .'    <lastmod>'.$lastmod.'</lastmod>'.PHP_EOL
            .'    <changefreq>weekly</changefreq>'.PHP_EOL
            .'    <priority>1.0</priority>'.PHP_EOL
            .$imageTags
            .'  </url>'.PHP_EOL
            .'</urlset>'.PHP_EOL;
    }

    private function xmlResponse(string $content): Response
    {
        return response($content, 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}
