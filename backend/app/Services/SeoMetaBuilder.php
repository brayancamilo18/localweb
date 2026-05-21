<?php

namespace App\Services;

use App\Models\Business;

class SeoMetaBuilder
{
    public function build(Business $business): array
    {
        $title = $this->buildTitle($business);
        $description = $this->buildDescription($business);
        $canonical = 'https://'.$business->subdomain.'.'.config('localweb.domains.tenant_suffix').'/';
        $ogImage = $this->resolveOgImage($business);

        return [
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'og_image' => $ogImage,
            'og_title' => $title,
            'og_description' => $description,
            'og_url' => $canonical,
            'og_type' => 'website',
            'og_site_name' => (string) config('localweb.seo.site_name'),
            'twitter_card' => 'summary_large_image',
            'twitter_title' => $title,
            'twitter_description' => $description,
            'twitter_image' => $ogImage,
            'robots' => $business->is_published ? 'index, follow' : 'noindex, nofollow',
            'hreflang' => 'es',
            'favicon_url' => null,
            'favicon_type' => null,
        ];
    }

    private function buildTitle(Business $business): string
    {
        $name = (string) $business->name;
        $tagline = trim((string) ($business->tagline ?? ''));
        $city = trim((string) ($business->city ?? ''));

        if ($tagline !== '') {
            $title = $name.' · '.$tagline;
        } elseif ($city !== '') {
            $title = $name.' — '.(string) $business->sector.' en '.$city;
        } else {
            $title = $name;
        }

        return mb_strimwidth($title, 0, 60, '…');
    }

    private function buildDescription(Business $business): string
    {
        $description = trim((string) ($business->description ?? ''));
        $tagline = trim((string) ($business->tagline ?? ''));
        $city = trim((string) ($business->city ?? ''));
        $name = (string) $business->name;
        $sector = (string) $business->sector;

        if ($description !== '') {
            $desc = $description;
        } elseif ($tagline !== '' && $city !== '') {
            $desc = $tagline.'. Encuéntranos en '.$city.'.';
        } else {
            $desc = $name.', '.$sector.' en '.($city !== '' ? $city : 'tu ciudad').'.';
        }

        $desc = str_replace(["\r", "\n"], ' ', $desc);

        return mb_strimwidth($desc, 0, 155, '…');
    }

    private function resolveOgImage(Business $business): string
    {
        if ($business->relationLoaded('images')) {
            $cover = $business->images
                ->where('section', 'cover')
                ->sortBy('display_order')
                ->first();

            $url = $cover?->url;
            if (is_string($url) && $url !== '') {
                return $url;
            }
        }

        return (string) config('localweb.seo.default_og_image');
    }
}
