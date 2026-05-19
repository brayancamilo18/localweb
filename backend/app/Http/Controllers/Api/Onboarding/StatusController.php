<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Enums\ImageSection;
use App\Enums\Plan;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Business;
use App\Models\BusinessImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StatusController extends BaseApiController
{
    public function __invoke(Request $request)
    {
        $user = $request->user()->load('business');

        if ($user->business && $user->business->onboarding_completed_at) {
            return $this->success([
                'is_complete' => true,
                'step' => 8,
            ]);
        }

        if ($user->business) {
            $cacheDraft = Cache::get("onboarding:{$user->id}", []);
            $cacheDraft = $this->withGalleryPreviewUrlsForCacheDraft($user->id, $cacheDraft);
            $cacheDraft = $this->withLogoPreviewUrlForCacheDraft($cacheDraft);
            $draft = $this->mergeDraftFromBusinessAndCache($user->business, $cacheDraft);

            $step = $this->resolveStepFromDraft($draft);
            // Tras pagar Pro el usuario debe publicar (paso 8); el plan ya es Pro pero aún no está publicado.
            if (
                $user->business->onboarding_completed_at === null
                && ! $user->business->is_published
                && $user->business->plan === Plan::Pro
            ) {
                $step = max($step, 8);
            }

            return $this->success([
                'is_complete' => false,
                'step' => $step,
                'draft' => $draft,
            ]);
        }

        $draft = Cache::get("onboarding:{$user->id}", []);
        $draft = $this->withGalleryPreviewUrlsForCacheDraft($user->id, $draft);
        $draft = $this->withLogoPreviewUrlForCacheDraft($draft);

        return $this->success([
            'is_complete' => false,
            'step' => $draft['step'] ?? 1,
            'draft' => $draft,
        ]);
    }

    /**
     * @param  array<string, mixed>  $draft
     * @return array<string, mixed>
     */
    private function withGalleryPreviewUrlsForCacheDraft(int $userId, array $draft): array
    {
        $paths = $draft['gallery_paths'] ?? [];
        if (! is_array($paths) || $paths === []) {
            return $draft;
        }

        $urls = [];
        foreach ($paths as $i => $p) {
            if (! is_string($p) || $p === '' || $p === '__synced__') {
                return $draft;
            }
            $expectedPrefix = "onboarding/{$userId}/gallery/";
            if (! str_starts_with($p, $expectedPrefix)) {
                return $draft;
            }
            $urls[] = '/api/v1/onboarding/draft-gallery/'.$i;
        }
        $draft['gallery_preview_urls'] = $urls;

        return $draft;
    }

    /**
     * @param  array<string, mixed>  $draft
     * @return array<string, mixed>
     */
    private function withLogoPreviewUrlForCacheDraft(array $draft): array
    {
        $path = $draft['logo_path'] ?? null;
        if (! is_string($path) || $path === '') {
            return $draft;
        }

        $draft['logo_preview_url'] = '/api/v1/onboarding/draft-logo';

        return $draft;
    }

    /**
     * Borrador sintético para hidratar el wizard cuando la caché de onboarding ya se vació
     * pero el usuario aún debe ver el paso 8 (p. ej. tras volver de Stripe).
     *
     * @return array<string, mixed>
     */
    private function draftFromBusiness(Business $business): array
    {
        $business->loadMissing('images');
        $images = $business->images;
        $hasCover = $images->contains(fn (BusinessImage $img) => $img->section === ImageSection::Cover);
        $galleryImages = $images
            ->where('section', ImageSection::Gallery)
            ->sortBy(fn (BusinessImage $img) => $img->display_order)
            ->values();

        return [
            'template_id' => $business->template_id,
            'sector' => $business->sector,
            'subdomain' => $business->subdomain,
            'cover_path' => $hasCover ? '__synced__' : null,
            'business_name' => $business->name,
            'tagline' => $business->tagline,
            'description' => $business->description,
            'gallery_paths' => $galleryImages->isNotEmpty()
                ? array_fill(0, $galleryImages->count(), '__synced__')
                : [],
            'gallery_preview_urls' => $galleryImages->map(fn (BusinessImage $img) => $img->url)->all(),
            'schedule' => $business->schedule,
            'address' => $business->address,
            'city' => $business->city,
            'country' => $business->country,
            'country_code' => $business->country_code,
            'phone' => $business->phone,
            'email' => $business->email,
        ];
    }

    /**
     * @param  array<string, mixed>  $cacheDraft
     * @return array<string, mixed>
     */
    private function mergeDraftFromBusinessAndCache(Business $business, array $cacheDraft): array
    {
        return array_merge($this->draftFromBusiness($business), $cacheDraft);
    }

    /**
     * Misma lógica que el front (`resolveOnboardingUiStep`): primer paso incompleto.
     *
     * @param  array<string, mixed>  $draft
     */
    private function resolveStepFromDraft(array $draft): int
    {
        $templateId = $draft['template_id'] ?? null;
        if ($templateId === null || (int) $templateId <= 0) {
            return 1;
        }

        $coverPath = $draft['cover_path'] ?? null;
        if ($coverPath === null || $coverPath === '') {
            return 2;
        }

        $businessName = $draft['business_name'] ?? null;
        if (! is_string($businessName) || trim($businessName) === '') {
            return 3;
        }

        $galleryPaths = $draft['gallery_paths'] ?? null;
        if (! is_array($galleryPaths) || $galleryPaths === []) {
            return 4;
        }

        if (! isset($draft['schedule']) || ! is_array($draft['schedule'])) {
            return 5;
        }

        $address = $draft['address'] ?? null;
        $phone = $draft['phone'] ?? null;
        if ($address === null || $address === '' || $phone === null || $phone === '') {
            return 6;
        }

        return 7;
    }
}
