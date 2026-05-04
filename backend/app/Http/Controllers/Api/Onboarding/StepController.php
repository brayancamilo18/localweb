<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Enums\ImageSection;
use App\Enums\Plan;
use App\Exceptions\Auth\GeocodingException;
use App\Http\Controllers\Api\BaseApiController;
use App\Services\BusinessSectorService;
use App\Services\BusinessService;
use App\Services\GeocodingService;
use App\Models\Business;
use App\Models\User;
use App\Services\ImageService;
use App\Services\TemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class StepController extends BaseApiController
{
    private function cacheKey(int $userId): string
    {
        return "onboarding:{$userId}";
    }

    /**
     * Pasa portada, sobre y galería del borrador (disco local onboarding/*) a business_images
     * y limpia caché + carpetas temporales. Debe ejecutarse también en plan Pro: antes solo
     * ocurría tras el webhook de Stripe (en local suele no dispararse).
     */
    private function finalizeOnboardingDraftMedia(User $user, Business $business, array $draft, ImageService $imageService): void
    {
        if (! empty($draft['cover_path'])) {
            $imageService->uploadImage(Storage::disk('local')->path($draft['cover_path']), $business, ImageSection::Cover, 0);
        }
        if (! empty($draft['about_photo_path'])) {
            $imageService->uploadImage(Storage::disk('local')->path($draft['about_photo_path']), $business, ImageSection::About, 0);
        }
        foreach (($draft['gallery_paths'] ?? []) as $index => $path) {
            $imageService->uploadImage(Storage::disk('local')->path($path), $business, ImageSection::Gallery, (int) $index);
        }

        Storage::disk('local')->deleteDirectory("onboarding/{$user->id}");
        Cache::forget($this->cacheKey($user->id));
    }

    public function step1(Request $request, TemplateService $templates, BusinessSectorService $sectors)
    {
        $data = $request->validate([
            'template_id' => ['required', 'integer'],
            'sector' => ['required', 'string'],
        ]);

        if (! $templates->exists((int) $data['template_id']) || ! $sectors->exists($data['sector'])) {
            return $this->error('Datos inválidos', ['template_or_sector' => 'invalid']);
        }

        $draft = Cache::get($this->cacheKey($request->user()->id), []);
        $draft = array_merge($draft, $data, ['step' => 1]);
        Cache::put($this->cacheKey($request->user()->id), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'next_step' => 2]);
    }

    public function step2(Request $request)
    {
        $request->validate([
            'cover' => ['required', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $userId = $request->user()->id;
        $path = $request->file('cover')->store("onboarding/{$userId}/cover", 'local');

        $draft = Cache::get($this->cacheKey($userId), []);
        $draft['cover_path'] = $path;
        $draft['step'] = 2;
        Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'preview_url' => $path, 'next_step' => 3]);
    }

    public function step3(Request $request)
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:80'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'about_photo' => ['nullable', 'image', 'max:10240'],
        ]);

        $userId = $request->user()->id;
        $draft = Cache::get($this->cacheKey($userId), []);

        // No incluir about_photo en $draft: UploadedFile no es serializable en Cache.
        $draft['business_name'] = $data['business_name'];
        $draft['tagline'] = $data['tagline'] ?? null;
        $draft['description'] = $data['description'] ?? null;
        $draft['step'] = 3;

        if ($request->hasFile('about_photo')) {
            $draft['about_photo_path'] = $request->file('about_photo')->store("onboarding/{$userId}/about", 'local');
        }

        Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'next_step' => 4]);
    }

    public function step4(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('business');
        $business = $user->business;
        $maxPhotos = 3;
        if ($business && ($business->is_pro || $business->plan === Plan::Pending)) {
            $maxPhotos = 20;
        }

        $request->validate([
            'photos' => ['required', 'array', 'max:'.$maxPhotos],
            'photos.*' => ['required', 'image', 'max:10240'],
        ]);

        $userId = $user->id;

        // Sustituir galería anterior en disco si el usuario vuelve al paso y vuelve a enviar fotos.
        Storage::disk('local')->deleteDirectory("onboarding/{$userId}/gallery");

        $paths = [];
        foreach ($request->file('photos', []) as $photo) {
            $paths[] = $photo->store("onboarding/{$userId}/gallery", 'local');
        }

        $draft = Cache::get($this->cacheKey($userId), []);
        $draft['gallery_paths'] = $paths;
        $draft['step'] = 4;
        Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'count' => count($paths), 'next_step' => 5]);
    }

    public function step5(Request $request)
    {
        $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $rules = ['schedule' => ['required', 'array']];
        foreach ($days as $day) {
            $rules["schedule.{$day}.open"] = ['required', 'date_format:H:i'];
            $rules["schedule.{$day}.close"] = ['required', 'date_format:H:i'];
            $rules["schedule.{$day}.closed"] = ['required', 'boolean'];
        }
        $data = $request->validate($rules);

        $draft = Cache::get($this->cacheKey($request->user()->id), []);
        $draft['schedule'] = $data['schedule'];
        $draft['step'] = 5;
        Cache::put($this->cacheKey($request->user()->id), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'next_step' => 6]);
    }

    public function step6(Request $request, GeocodingService $geo)
    {
        $data = $request->validate([
            'address' => ['required', 'string'],
            'phone' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        $geocoded = false;
        try {
            $coords = $geo->geocode($data['address']);
            $data['lat'] = $coords['lat'];
            $data['lng'] = $coords['lng'];
            $geocoded = true;
        } catch (GeocodingException) {
            // Warning only.
        }

        $draft = Cache::get($this->cacheKey($request->user()->id), []);
        $draft = array_merge($draft, $data, ['step' => 6]);
        Cache::put($this->cacheKey($request->user()->id), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'geocoded' => $geocoded, 'next_step' => 7]);
    }

    public function step7(Request $request, BusinessService $businessService, ImageService $imageService)
    {
        $data = $request->validate([
            'plan' => ['required', 'in:free,pro'],
            'subdomain' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $draft = Cache::get($this->cacheKey($user->id), []);
        $payload = [
            'name' => $draft['business_name'] ?? 'Mi negocio',
            'subdomain_type' => $data['plan'] === 'pro' ? 'custom' : 'random',
            'sector' => $draft['sector'] ?? 'otros',
            'template_id' => $draft['template_id'] ?? null,
            'tagline' => $draft['tagline'] ?? null,
            'description' => $draft['description'] ?? null,
            'phone' => $draft['phone'] ?? null,
            'address' => $draft['address'] ?? null,
            'lat' => $draft['lat'] ?? null,
            'lng' => $draft['lng'] ?? null,
            'schedule' => $draft['schedule'] ?? null,
            'subdomain' => $data['subdomain'] ?? null,
        ];

        if ($data['plan'] === 'pro') {
            if (! $data['subdomain'] || ! $businessService->isSubdomainAvailable($data['subdomain'])) {
                return $this->error('Subdominio inválido o no disponible', ['subdomain' => 'invalid']);
            }
            $business = $businessService->createFromOnboarding($user, $payload, 'pending');
            $user->refresh();

            $this->finalizeOnboardingDraftMedia($user, $business, $draft, $imageService);

            if (app()->environment('testing')) {
                return $this->success([
                    'ok' => true,
                    'plan' => 'pro',
                    'checkout_url' => 'https://checkout.stripe.test/session_onboarding_pro',
                ]);
            }

            $priceId = (string) env('STRIPE_PRO_PRICE_ID', '');
            if ($priceId === '') {
                return $this->error(
                    'El pago Pro no está configurado en el servidor (STRIPE_PRO_PRICE_ID).',
                    ['stripe' => 'not_configured'],
                    503
                );
            }

            try {
                $session = $user->newSubscription('default', $priceId)
                    ->allowPromotionCodes()
                    ->checkout([
                        'success_url' => config('app.frontend_url').'/onboarding?billing=success&session_id={CHECKOUT_SESSION_ID}',
                        'cancel_url' => config('app.frontend_url').'/onboarding?billing=cancelled',
                        'metadata' => [
                            'user_id' => (string) $user->id,
                            'business_id' => (string) $business->id,
                            'subdomain' => $business->subdomain,
                        ],
                        'locale' => 'es',
                    ]);
            } catch (\Throwable $e) {
                report($e);

                return $this->error(
                    'No se pudo iniciar el pago con Stripe. Revisa las claves API y el precio.',
                    ['stripe' => 'checkout_failed'],
                    502
                );
            }

            return $this->success([
                'ok' => true,
                'plan' => 'pro',
                'checkout_url' => $session->url,
            ]);
        }

        $business = $businessService->createFromOnboarding($user, $payload, 'free');

        $this->finalizeOnboardingDraftMedia($user, $business, $draft, $imageService);

        return $this->success([
            'ok' => true,
            'plan' => 'free',
            'public_url' => "http://{$business->subdomain}.localhost",
            'next_step' => 8,
        ]);
    }

    public function step8(Request $request, BusinessService $service)
    {
        $business = $request->user()->business;
        if (! $business) {
            return $this->error('Business no encontrado', [], 404);
        }
        $service->publish($business);

        return $this->success([
            'ok' => true,
            'public_url' => "http://{$business->subdomain}.localhost",
        ]);
    }
}
