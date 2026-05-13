<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Enums\ImageSection;
use App\Enums\Plan;
use App\Exceptions\Auth\GeocodingException;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Business;
use App\Models\User;
use App\Services\BusinessSectorService;
use App\Services\BusinessService;
use App\Services\GeocodingService;
use App\Services\ImageService;
use App\Services\TemplateService;
use Illuminate\Http\JsonResponse;
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
        if (! empty($draft['cover_path_2'])) {
            $imageService->uploadImage(Storage::disk('local')->path($draft['cover_path_2']), $business, ImageSection::Cover, 1);
        }
        if (! empty($draft['cover_path_3'])) {
            $imageService->uploadImage(Storage::disk('local')->path($draft['cover_path_3']), $business, ImageSection::Cover, 2);
        }
        if (! empty($draft['about_photo_path'])) {
            $imageService->uploadImage(Storage::disk('local')->path($draft['about_photo_path']), $business, ImageSection::About, 0);
        }
        foreach (($draft['gallery_paths'] ?? []) as $index => $path) {
            $imageService->uploadImage(Storage::disk('local')->path($path), $business, ImageSection::Gallery, (int) $index);
        }

        if (! empty($draft['logo_path'])) {
            $logoRelative = $draft['logo_path'];
            if (is_string($logoRelative) && $logoRelative !== '') {
                $expectedPrefix = 'onboarding/'.$user->id.'/logo/';
                if (str_starts_with($logoRelative, $expectedPrefix) && is_file(Storage::disk('local')->path($logoRelative))) {
                    $imageService->replaceBusinessLogo(Storage::disk('local')->path($logoRelative), $business);
                }
            }
        }

        Storage::disk('local')->deleteDirectory("onboarding/{$user->id}");
        Cache::forget($this->cacheKey($user->id));
    }

    public function step1(Request $request, TemplateService $templates, BusinessSectorService $sectors)
    {
        $data = $request->validate([
            'template_id' => ['required', 'integer'],
            'sector' => ['required', 'string'],
            'logo' => ['nullable', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
            'remove_logo' => ['sometimes', 'boolean'],
        ]);

        if (! $templates->exists((int) $data['template_id']) || ! $sectors->exists($data['sector'])) {
            return $this->error('Datos inválidos', ['template_or_sector' => 'invalid']);
        }

        $userId = $request->user()->id;
        $draft = Cache::get($this->cacheKey($userId), []);

        if ($request->boolean('remove_logo')) {
            if (! empty($draft['logo_path']) && is_string($draft['logo_path'])) {
                Storage::disk('local')->delete($draft['logo_path']);
            }
            unset($draft['logo_path']);
        }

        if ($request->hasFile('logo')) {
            if (! empty($draft['logo_path']) && is_string($draft['logo_path'])) {
                Storage::disk('local')->delete($draft['logo_path']);
            }
            $draft['logo_path'] = $request->file('logo')->store("onboarding/{$userId}/logo", 'local');
        }

        $draft = array_merge($draft, [
            'template_id' => $data['template_id'],
            'sector' => $data['sector'],
            'step' => 1,
        ]);
        Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'next_step' => 2]);
    }

    public function step2(Request $request)
    {
        $request->validate([
            'cover' => ['required', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            'cover2' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            'cover3' => ['nullable', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            'logo' => ['nullable', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
            'remove_logo' => ['sometimes', 'boolean'],
        ]);

        $userId = $request->user()->id;
        $draft = Cache::get($this->cacheKey($userId), []);

        if ($request->boolean('remove_logo')) {
            if (! empty($draft['logo_path']) && is_string($draft['logo_path'])) {
                Storage::disk('local')->delete($draft['logo_path']);
            }
            unset($draft['logo_path']);
        }

        if ($request->hasFile('logo')) {
            if (! empty($draft['logo_path']) && is_string($draft['logo_path'])) {
                Storage::disk('local')->delete($draft['logo_path']);
            }
            $draft['logo_path'] = $request->file('logo')->store("onboarding/{$userId}/logo", 'local');
        }

        $draft['cover_path'] = $request->file('cover')->store("onboarding/{$userId}/cover", 'local');

        if ($request->hasFile('cover2')) {
            $draft['cover_path_2'] = $request->file('cover2')->store("onboarding/{$userId}/cover", 'local');
        } else {
            unset($draft['cover_path_2']);
        }

        if ($request->hasFile('cover3')) {
            $draft['cover_path_3'] = $request->file('cover3')->store("onboarding/{$userId}/cover", 'local');
        } else {
            unset($draft['cover_path_3']);
        }

        $draft['step'] = 2;
        Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

        return $this->success(['ok' => true, 'preview_url' => $draft['cover_path'], 'next_step' => 3]);
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

    public function step4(Request $request, ImageService $imageService)
    {
        $user = $request->user();
        $user->loadMissing('business');
        $business = $user->business;
        $maxPhotos = 3;
        if ($business && ($business->is_pro || $business->plan === Plan::Pending)) {
            $maxPhotos = 20;
        }

        $userId = $user->id;

        /** @var array<int, \Illuminate\Http\UploadedFile>|null $uploaded */
        $uploaded = $request->file('photos');
        $newPhotos = is_array($uploaded) ? array_values(array_filter($uploaded)) : [];

        if ($business) {
            $request->validate([
                'photos' => ['nullable', 'array', 'max:'.$maxPhotos],
                'photos.*' => ['required', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            ]);

            $existingCount = $business->images()
                ->where('section', ImageSection::Gallery->value)
                ->count();
            $totalAfter = $existingCount + count($newPhotos);
            if ($totalAfter > $maxPhotos) {
                return $this->error(
                    "Solo puedes tener hasta {$maxPhotos} fotos en la galería.",
                    ['photos' => 'too_many'],
                    422
                );
            }

            foreach ($newPhotos as $i => $photo) {
                $imageService->uploadImage($photo, $business, ImageSection::Gallery, $existingCount + $i);
            }

            return $this->success([
                'ok' => true,
                'count' => $totalAfter,
                'next_step' => 5,
                'mode' => 'append',
            ]);
        }

        $request->validate([
            'photos' => ['required', 'array', 'max:'.$maxPhotos],
            'photos.*' => ['required', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
        ]);

        Storage::disk('local')->deleteDirectory("onboarding/{$userId}/gallery");

        $paths = [];
        foreach ($newPhotos as $photo) {
            $paths[] = $photo->store("onboarding/{$userId}/gallery", 'local');
        }

        $draft = Cache::get($this->cacheKey($userId), []);
        $draft['gallery_paths'] = $paths;
        $draft['step'] = 4;
        Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

        return $this->success([
            'ok' => true,
            'count' => count($paths),
            'next_step' => 5,
            'mode' => 'draft',
        ]);
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
            /** Email público de contacto del negocio (columna propia en
             * `businesses`, ver migración add_email_to_businesses_table).
             * Es independiente del email de login del owner: el dueño puede
             * mostrar `info@…` o `reservas@…` aunque inicie sesión con su
             * correo personal. Se recoge en step 6 y se persiste aquí. */
            'email' => isset($draft['email']) ? trim((string) $draft['email']) : null,
            'address' => $draft['address'] ?? null,
            'lat' => $draft['lat'] ?? null,
            'lng' => $draft['lng'] ?? null,
            'schedule' => $draft['schedule'] ?? null,
            'subdomain' => $data['subdomain'] ?? null,
        ];

        if ($data['plan'] === 'pro') {
            $rawSubdomain = (string) ($data['subdomain'] ?? '');
            if ($rawSubdomain === '') {
                return $this->error('Falta el subdominio', ['subdomain' => 'too_short']);
            }
            $reason = $businessService->getSubdomainRejectionReason($rawSubdomain);
            if ($reason !== null) {
                $messages = [
                    'reserved' => 'Ese subdominio está reservado.',
                    'too_short' => 'El subdominio es demasiado corto.',
                    'too_long' => 'El subdominio es demasiado largo.',
                    'invalid_format' => 'El subdominio solo admite letras, números y guiones.',
                    'taken' => 'Ese subdominio ya está en uso.',
                ];

                return $this->error(
                    $messages[$reason] ?? 'Subdominio inválido.',
                    ['subdomain' => $reason],
                );
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

            $priceId = (string) config('cashier.pro_price_id', '');
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

        // Para Free no hay paso 9 (extras Pro), así que cerramos el onboarding aquí mismo.
        // Para Pro/Pending lo difiere `completeOnboarding()` (POST /onboarding/finalize),
        // que es lo que dispara Step9 al pulsar «Ir a mi dashboard». Si lo cerráramos aquí,
        // el OnboardingGuard del frontend echaría al usuario fuera del wizard antes de
        // poder configurar servicios e integraciones (bug del bucle reportado).
        if ($business->plan === Plan::Free) {
            $service->completeOnboarding($business->refresh());
        }

        return $this->success([
            'ok' => true,
            'public_url' => "http://{$business->subdomain}.localhost",
        ]);
    }

    /**
     * Cierra el onboarding tras Step9 (extras Pro). Idempotente: si ya estaba cerrado,
     * sigue devolviendo 200 sin tocar la fecha (así Step9 no rompe si el usuario hace
     * doble click o vuelve atrás y reintenta). Solo accesible si el negocio existe.
     */
    public function completeOnboarding(Request $request, BusinessService $service): JsonResponse
    {
        $business = $request->user()->business;
        if (! $business) {
            return $this->error('Business no encontrado', [], 404);
        }

        $service->completeOnboarding($business);

        return $this->success(['ok' => true]);
    }
}
