<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Enums\ImageSection;
use App\Enums\Plan;
use App\Exceptions\Auth\GeocodingException;
use App\Http\Controllers\Api\BaseApiController;
use App\Jobs\GenerateBusinessSeoMeta;
use App\Models\Business;
use App\Models\User;
use App\Services\BusinessSectorService;
use App\Services\BusinessService;
use App\Services\GeocodingService;
use App\Services\ImageService;
use App\Services\PublicPageUrlService;
use App\Services\ReferralCheckoutService;
use App\Services\TemplateService;
use App\Support\OnboardingDraftMediaPath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class StepController extends BaseApiController
{
    private function cacheKey(int $userId): string
    {
        return "onboarding:{$userId}";
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function syncBusinessFromStep(User $user, BusinessService $businessService, array $fields): void
    {
        $business = $user->business;
        if ($business === null) {
            return;
        }

        $businessService->syncOnboardingFields($business, $fields);
    }

    /**
     * @return array<string, mixed>
     */
    private function draftFieldsFromBusiness(Business $business): array
    {
        return [
            'template_id' => $business->template_id,
            'sector' => $business->sector,
            'business_name' => $business->name,
            'tagline' => $business->tagline,
            'description' => $business->description,
            'about_title' => $business->about_title,
            'address' => $business->address,
            'city' => $business->city,
            'country' => $business->country,
            'country_code' => $business->country_code,
            'lat' => $business->lat,
            'lng' => $business->lng,
            'phone' => $business->phone,
            'email' => $business->email,
            'schedule' => $business->schedule,
            'subdomain' => $business->subdomain,
        ];
    }

    /**
     * Pasa portada, sobre y galería del borrador (disco local onboarding/*) a business_images
     * y limpia caché + carpetas temporales. Debe ejecutarse también en plan Pro: antes solo
     * ocurría tras el webhook de Stripe (en local suele no dispararse).
     */
    private function finalizeOnboardingDraftMedia(User $user, Business $business, array $draft, ImageService $imageService): void
    {
        $userId = (int) $user->id;

        $coverPath = OnboardingDraftMediaPath::resolve($userId, $draft['cover_path'] ?? null);
        if ($coverPath !== null) {
            $imageService->uploadImage($coverPath, $business, ImageSection::Cover, 0);
        }
        $coverPath2 = OnboardingDraftMediaPath::resolve($userId, $draft['cover_path_2'] ?? null);
        if ($coverPath2 !== null) {
            $imageService->uploadImage($coverPath2, $business, ImageSection::Cover, 1);
        }
        $coverPath3 = OnboardingDraftMediaPath::resolve($userId, $draft['cover_path_3'] ?? null);
        if ($coverPath3 !== null) {
            $imageService->uploadImage($coverPath3, $business, ImageSection::Cover, 2);
        }
        $aboutPath = OnboardingDraftMediaPath::resolve($userId, $draft['about_photo_path'] ?? null);
        if ($aboutPath !== null) {
            $imageService->uploadImage($aboutPath, $business, ImageSection::About, 0);
        }
        foreach (($draft['gallery_paths'] ?? []) as $index => $path) {
            $galleryPath = OnboardingDraftMediaPath::resolve($userId, $path);
            if ($galleryPath === null) {
                continue;
            }
            $imageService->uploadImage($galleryPath, $business, ImageSection::Gallery, (int) $index);
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

    public function step1(Request $request, TemplateService $templates, BusinessSectorService $sectors, BusinessService $businessService)
    {
        $data = $request->validate([
            'template_id' => ['required', 'integer'],
            'sector' => ['required', 'string'],
            'logo' => ['nullable', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
            'remove_logo' => ['sometimes', 'boolean'],
        ], [
            'template_id.required' => 'Selecciona una plantilla.',
            'sector.required' => 'Selecciona el sector de tu negocio.',
            'logo.image' => 'El logo debe ser una imagen.',
            'logo.max' => 'El logo no puede pesar más de 2 MB.',
            'logo.mimes' => 'El logo debe ser JPG, PNG o WebP.',
        ]);

        if (! $templates->exists((int) $data['template_id']) || ! $sectors->exists($data['sector'])) {
            return $this->error('La plantilla o el sector seleccionados no son válidos.', ['template_or_sector' => ['La plantilla o el sector seleccionados no son válidos.']]);
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

        $this->syncBusinessFromStep($request->user(), $businessService, [
            'template_id' => $data['template_id'],
            'sector' => $data['sector'],
        ]);

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
        ], [
            'cover.required' => 'Sube al menos una foto de portada.',
            'cover.image' => 'La portada debe ser una imagen.',
            'cover.max' => 'La portada no puede pesar más de 10 MB.',
            'cover.mimes' => 'La portada debe ser JPG, PNG o WebP.',
            'cover2.image' => 'La segunda portada debe ser una imagen.',
            'cover2.max' => 'La segunda portada no puede pesar más de 10 MB.',
            'cover2.mimes' => 'La segunda portada debe ser JPG, PNG o WebP.',
            'cover3.image' => 'La tercera portada debe ser una imagen.',
            'cover3.max' => 'La tercera portada no puede pesar más de 10 MB.',
            'cover3.mimes' => 'La tercera portada debe ser JPG, PNG o WebP.',
            'logo.image' => 'El logo debe ser una imagen.',
            'logo.max' => 'El logo no puede pesar más de 2 MB.',
            'logo.mimes' => 'El logo debe ser JPG, PNG o WebP.',
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

    public function step3(Request $request, BusinessService $businessService)
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:80'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'about_title' => ['nullable', 'string', 'max:160'],
            'about_photo' => ['nullable', 'image', 'max:10240'],
        ], [
            'business_name.required' => 'Indica el nombre de tu negocio.',
            'business_name.max' => 'El nombre del negocio no puede superar los 80 caracteres.',
            'tagline.max' => 'El lema no puede superar los 120 caracteres.',
            'description.max' => 'La descripción no puede superar los 500 caracteres.',
            'about_title.max' => 'El título de «Sobre nosotros» no puede superar los 160 caracteres.',
            'about_photo.image' => 'La foto «sobre nosotros» debe ser una imagen.',
            'about_photo.max' => 'La foto «sobre nosotros» no puede pesar más de 10 MB.',
        ]);

        $userId = $request->user()->id;
        $draft = Cache::get($this->cacheKey($userId), []);

        // No incluir about_photo en $draft: UploadedFile no es serializable en Cache.
        $draft['business_name'] = $data['business_name'];
        $draft['tagline'] = $data['tagline'] ?? null;
        $draft['description'] = $data['description'] ?? null;
        $draft['about_title'] = $data['about_title'] ?? null;
        $draft['step'] = 3;

        if ($request->hasFile('about_photo')) {
            $draft['about_photo_path'] = $request->file('about_photo')->store("onboarding/{$userId}/about", 'local');
        }

        Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

        $this->syncBusinessFromStep($request->user(), $businessService, [
            'name' => trim($data['business_name']),
            'tagline' => $data['tagline'] ?? null,
            'description' => $data['description'] ?? null,
            'about_title' => $data['about_title'] ?? null,
        ]);

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

        /** @var array<int, UploadedFile>|null $uploaded */
        $uploaded = $request->file('photos');
        $newPhotos = is_array($uploaded) ? array_values(array_filter($uploaded)) : [];

        if ($business) {
            if ($request->boolean('replace_gallery')) {
                $request->validate([
                    'photos' => ['required', 'array', 'min:1', 'max:'.$maxPhotos],
                    'photos.*' => ['required', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
                ], [
                    'photos.required' => 'Sube al menos una foto para tu galería.',
                    'photos.array' => 'El formato de las fotos no es válido.',
                    'photos.min' => 'Sube al menos una foto.',
                    'photos.max' => 'Puedes subir como máximo :max fotos en la galería.',
                    'photos.*.required' => 'Falta alguna de las fotos.',
                    'photos.*.image' => 'Cada foto debe ser una imagen.',
                    'photos.*.max' => 'Cada foto no puede pesar más de 10 MB.',
                    'photos.*.mimes' => 'Las fotos deben ser JPG, PNG o WebP.',
                ]);

                $business->images()
                    ->where('section', ImageSection::Gallery->value)
                    ->get()
                    ->each(fn ($image) => $imageService->deleteImage($image));

                foreach ($newPhotos as $i => $photo) {
                    $imageService->uploadImage($photo, $business, ImageSection::Gallery, $i);
                }

                $count = count($newPhotos);
                $draft = Cache::get($this->cacheKey($userId), []);
                $draft['gallery_paths'] = array_fill(0, $count, '__synced__');
                $draft['step'] = 4;
                Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

                return $this->success([
                    'ok' => true,
                    'count' => $count,
                    'next_step' => 5,
                    'mode' => 'replace',
                ]);
            }

            $request->validate([
                'photos' => ['nullable', 'array', 'max:'.$maxPhotos],
                'photos.*' => ['required', 'image', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            ], [
                'photos.array' => 'El formato de las fotos no es válido.',
                'photos.max' => 'Puedes subir como máximo :max fotos en la galería.',
                'photos.*.required' => 'Falta alguna de las fotos.',
                'photos.*.image' => 'Cada foto debe ser una imagen.',
                'photos.*.max' => 'Cada foto no puede pesar más de 10 MB.',
                'photos.*.mimes' => 'Las fotos deben ser JPG, PNG o WebP.',
            ]);

            $existingCount = $business->images()
                ->where('section', ImageSection::Gallery->value)
                ->count();

            if ($newPhotos === [] && $existingCount > 0) {
                return $this->success([
                    'ok' => true,
                    'count' => $existingCount,
                    'next_step' => 5,
                    'mode' => 'append',
                    'unchanged' => true,
                ]);
            }

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

            $draft = Cache::get($this->cacheKey($userId), []);
            $draft['gallery_paths'] = array_fill(0, $totalAfter, '__synced__');
            $draft['step'] = 4;
            Cache::put($this->cacheKey($userId), $draft, now()->addHours(4));

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
        ], [
            'photos.required' => 'Sube al menos una foto para tu galería.',
            'photos.array' => 'El formato de las fotos no es válido.',
            'photos.max' => 'Puedes subir como máximo :max fotos en la galería.',
            'photos.*.required' => 'Falta alguna de las fotos.',
            'photos.*.image' => 'Cada foto debe ser una imagen.',
            'photos.*.max' => 'Cada foto no puede pesar más de 10 MB.',
            'photos.*.mimes' => 'Las fotos deben ser JPG, PNG o WebP.',
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

    public function step5(Request $request, BusinessService $businessService)
    {
        $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $rules = ['schedule' => ['required', 'array']];
        foreach ($days as $day) {
            $rules["schedule.{$day}.open"] = ['required', 'date_format:H:i'];
            $rules["schedule.{$day}.close"] = ['required', 'date_format:H:i'];
            $rules["schedule.{$day}.closed"] = ['required', 'boolean'];
        }
        $data = $request->validate($rules, [], [
            'schedule.mon.open' => 'apertura del lunes',
            'schedule.mon.close' => 'cierre del lunes',
            'schedule.mon.closed' => 'estado del lunes',
            'schedule.tue.open' => 'apertura del martes',
            'schedule.tue.close' => 'cierre del martes',
            'schedule.tue.closed' => 'estado del martes',
            'schedule.wed.open' => 'apertura del miércoles',
            'schedule.wed.close' => 'cierre del miércoles',
            'schedule.wed.closed' => 'estado del miércoles',
            'schedule.thu.open' => 'apertura del jueves',
            'schedule.thu.close' => 'cierre del jueves',
            'schedule.thu.closed' => 'estado del jueves',
            'schedule.fri.open' => 'apertura del viernes',
            'schedule.fri.close' => 'cierre del viernes',
            'schedule.fri.closed' => 'estado del viernes',
            'schedule.sat.open' => 'apertura del sábado',
            'schedule.sat.close' => 'cierre del sábado',
            'schedule.sat.closed' => 'estado del sábado',
            'schedule.sun.open' => 'apertura del domingo',
            'schedule.sun.close' => 'cierre del domingo',
            'schedule.sun.closed' => 'estado del domingo',
        ]);

        $draft = Cache::get($this->cacheKey($request->user()->id), []);
        $draft['schedule'] = $data['schedule'];
        $draft['step'] = 5;
        Cache::put($this->cacheKey($request->user()->id), $draft, now()->addHours(4));

        $this->syncBusinessFromStep($request->user(), $businessService, [
            'schedule' => $data['schedule'],
        ]);

        return $this->success(['ok' => true, 'next_step' => 6]);
    }

    public function step6(Request $request, GeocodingService $geo, BusinessService $businessService)
    {
        $data = $request->validate([
            'address' => ['required', 'string'],
            'city' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', 'max:120'],
            'country_code' => ['required', 'string', 'size:2', 'regex:/^[A-Z]{2}$/'],
            'phone' => ['required', 'string'],
            'email' => ['required', 'email'],
        ], [
            'address.required' => 'Indica la dirección de tu negocio.',
            'city.required' => 'Indica la ciudad.',
            'country.required' => 'Indica el país.',
            'country_code.required' => 'Indica el código de país.',
            'country_code.size' => 'El código de país debe tener 2 letras.',
            'country_code.regex' => 'El código de país debe tener 2 letras en mayúscula (por ejemplo, ES).',
            'phone.required' => 'Indica un teléfono de contacto.',
            'email.required' => 'Indica un correo de contacto público.',
            'email.email' => 'Introduce un correo electrónico válido.',
        ]);

        $geocoded = false;
        $geocodePrecision = null;
        try {
            $coords = $geo->geocode(
                $data['address'],
                $data['city'] ?? null,
                isset($data['country_code']) ? strtoupper((string) $data['country_code']) : null,
            );
            $data['lat'] = $coords['lat'];
            $data['lng'] = $coords['lng'];
            $geocoded = true;
            $geocodePrecision = $coords['precision'] ?? 'area';
        } catch (GeocodingException) {
            // Warning only.
        }

        $draft = Cache::get($this->cacheKey($request->user()->id), []);
        $draft = array_merge($draft, $data, ['step' => 6]);
        Cache::put($this->cacheKey($request->user()->id), $draft, now()->addHours(4));

        $this->syncBusinessFromStep($request->user(), $businessService, [
            'address' => $data['address'],
            'city' => $data['city'],
            'country' => $data['country'],
            'country_code' => strtoupper($data['country_code']),
            'lat' => $data['lat'] ?? null,
            'lng' => $data['lng'] ?? null,
            'phone' => $data['phone'],
            'email' => trim($data['email']),
        ]);

        return $this->success([
            'ok' => true,
            'geocoded' => $geocoded,
            'geocode_precision' => $geocoded ? $geocodePrecision : null,
            'next_step' => 7,
        ]);
    }

    public function step7(Request $request, BusinessService $businessService, ImageService $imageService, PublicPageUrlService $urls, ReferralCheckoutService $referralCheckout)
    {
        $data = $request->validate([
            'plan' => ['required', 'in:free,pro'],
            'subdomain' => ['nullable', 'string'],
        ], [
            'plan.required' => 'Selecciona un plan.',
            'plan.in' => 'El plan indicado no es válido.',
        ]);

        $user = $request->user()->loadMissing('business');
        $draft = Cache::get($this->cacheKey($user->id), []);
        if ($user->business) {
            $draft = array_merge($this->draftFieldsFromBusiness($user->business), $draft);
        }
        $payload = [
            'name' => $draft['business_name'] ?? 'Mi negocio',
            'subdomain_type' => $data['plan'] === 'pro' ? 'custom' : 'random',
            'sector' => $draft['sector'] ?? 'otros',
            'template_id' => $draft['template_id'] ?? null,
            'tagline' => $draft['tagline'] ?? null,
            'description' => $draft['description'] ?? null,
            'about_title' => $draft['about_title'] ?? null,
            'phone' => $draft['phone'] ?? null,
            /** Email público de contacto del negocio (columna propia en
             * `businesses`, ver migración add_email_to_businesses_table).
             * Es independiente del email de login del owner: el dueño puede
             * mostrar `info@…` o `reservas@…` aunque inicie sesión con su
             * correo personal. Se recoge en step 6 y se persiste aquí. */
            'email' => isset($draft['email']) ? trim((string) $draft['email']) : null,
            'address' => $draft['address'] ?? null,
            'city' => $draft['city'] ?? null,
            'country' => $draft['country'] ?? null,
            'country_code' => isset($draft['country_code'])
                ? strtoupper((string) $draft['country_code'])
                : null,
            'lat' => $draft['lat'] ?? null,
            'lng' => $draft['lng'] ?? null,
            'schedule' => $draft['schedule'] ?? null,
            'subdomain' => $data['subdomain'] ?? null,
        ];

        $existingBusiness = $user->business;

        if ($data['plan'] === 'pro') {
            $rawSubdomain = (string) ($data['subdomain'] ?? '');
            if ($rawSubdomain === '') {
                return $this->error('Falta el subdominio', ['subdomain' => 'too_short']);
            }
            $excludeId = $existingBusiness?->id;
            $reason = $businessService->getSubdomainRejectionReason($rawSubdomain, $excludeId);
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
            $payload['subdomain'] = $rawSubdomain;
            $business = $existingBusiness
                ? $businessService->applyOnboardingPlan($existingBusiness, $payload, 'pending')
                : $businessService->createFromOnboarding($user, $payload, 'pending');
            $user->refresh();

            $this->finalizeOnboardingDraftMedia($user, $business, $draft, $imageService);

            $priceId = (string) config('cashier.pro_price_id', '');
            if ($priceId === '') {
                return $this->error(
                    'El pago Pro no está configurado en el servidor (STRIPE_PRO_PRICE_ID).',
                    ['stripe' => 'not_configured'],
                    503
                );
            }

            $subscription = $user->newSubscription('default', $priceId);
            ['subscription' => $subscription, 'referral' => $referral] = $referralCheckout->applyToSubscription($user, $subscription);

            if (app()->environment('testing')) {
                return $this->success([
                    'ok' => true,
                    'plan' => 'pro',
                    'checkout_url' => 'https://checkout.stripe.test/session_onboarding_pro',
                ]);
            }

            try {
                $session = $subscription->checkout([
                    'success_url' => config('app.frontend_url').'/onboarding?billing=success&session_id={CHECKOUT_SESSION_ID}',
                    'cancel_url' => config('app.frontend_url').'/onboarding?billing=cancelled',
                    'metadata' => array_merge([
                        'user_id' => (string) $user->id,
                        'business_id' => (string) $business->id,
                        'subdomain' => $business->subdomain,
                    ], array_map('strval', $referralCheckout->referralMetadata($referral))),
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

        $business = $existingBusiness
            ? $businessService->applyOnboardingPlan($existingBusiness, $payload, 'free')
            : $businessService->createFromOnboarding($user, $payload, 'free');

        $this->finalizeOnboardingDraftMedia($user, $business, $draft, $imageService);

        return $this->success([
            'ok' => true,
            'plan' => 'free',
            'public_url' => $urls->forBusiness($business),
            'next_step' => 8,
        ]);
    }

    public function step8(Request $request, BusinessService $service, PublicPageUrlService $urls)
    {
        $business = $request->user()->business;
        if (! $business) {
            return $this->error('Business no encontrado', [], 404);
        }

        $service->publish($business);

        // SEO con IA: solo Pro, en background. Silencioso: si la IA está apagada
        // o el job falla, SeoMetaBuilder tiene fallback en runtime.
        if ($business->plan !== Plan::Free) {
            GenerateBusinessSeoMeta::dispatch($business->id)->afterCommit();
        }

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
            'public_url' => $urls->forBusiness($business->refresh()),
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

        // Pro ya publicó en step 8: los extras (step 9) no deben bloquearse por campos
        // perdidos en un reset antiguo (p. ej. template_id null tras cerrar sesión).
        $publishedPro = $business->is_published
            && in_array($business->plan, [Plan::Pro, Plan::Pending], true);

        if (! $publishedPro && ! $service->isOnboardingDataComplete($business)) {
            return response()->json([
                'message' => 'Faltan datos del onboarding para publicar',
                'missing' => $service->onboardingMissingFields($business),
            ], 422);
        }

        $service->completeOnboarding($business);

        return $this->success(['ok' => true]);
    }
}
