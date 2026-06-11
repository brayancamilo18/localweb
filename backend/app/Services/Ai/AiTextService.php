<?php

namespace App\Services\Ai;

use App\Exceptions\Ai\AiQuotaExceededException;
use App\Exceptions\Ai\AiUnavailableException;
use App\Models\AiGeneration;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

class AiTextService
{
    public const TONES = ['profesional', 'cercano', 'vendedor'];

    public const FIELDS = ['tagline', 'description'];

    private const FEATURE_BUSINESS_DESCRIPTION = 'business_description';

    private const FEATURE_SERVICE_DESCRIPTION = 'service_description';

    private const FEATURE_IMPROVE_TEXT = 'improve_text';

    private const FEATURE_SEO_META = 'seo_meta';

    private const FEATURE_SOCIAL_POSTS = 'social_posts';

    public const NETWORKS = ['instagram', 'facebook', 'google_my_business'];

    public function __construct(
        private readonly AiProviderContract $provider,
    ) {}

    public function remainingQuota(User $user): array
    {
        $remaining = [];

        foreach (config('ai.daily_limits', []) as $feature => $limit) {
            $used = $this->countGenerationsSinceDayStart($user, $feature);
            $remaining[$feature] = max(0, $limit - $used);
        }

        return $remaining;
    }

    public function generateBusinessDescription(User $user, string $businessName, ?string $tagline): array
    {
        $this->assertEnabled();
        $this->assertQuota($user, self::FEATURE_BUSINESS_DESCRIPTION);

        $business = $user->business;
        $sector = str_replace('_', ' ', (string) $business->sector);
        $city = $business->city;

        $systemPrompt = 'Eres un copywriter especializado en negocios locales españoles. Escribes en español de España, con un tono cercano y profesional, sin sonar a folleto publicitario. Nunca inventas datos concretos como años de experiencia, premios o direcciones.';

        $userPromptParts = [
            "Nombre del negocio: {$businessName}",
            "Sector: {$sector}",
        ];

        if ($city !== null && $city !== '') {
            $userPromptParts[] = "Ciudad: {$city}";
        }

        if ($tagline !== null && $tagline !== '') {
            $userPromptParts[] = "Eslogan: {$tagline}";
        }

        $userPromptParts[] = 'Genera EXACTAMENTE 3 variantes de descripción del negocio de entre 200 y 280 caracteres cada una, separadas por el delimitador |||, SIN numeración, sin comillas y sin texto adicional antes o después.';

        $raw = $this->provider->complete($systemPrompt, implode("\n", $userPromptParts));
        $variants = $this->parseVariants($raw);

        if ($variants === []) {
            throw new AiUnavailableException('No se pudieron generar variantes de descripción.');
        }

        $this->recordGeneration($user, self::FEATURE_BUSINESS_DESCRIPTION);

        return ['variants' => $variants];
    }

    /**
     * @return array{description: string, suggested_price_min: ?float, suggested_price_max: ?float}
     */
    public function generateServiceDescription(User $user, string $serviceName): array
    {
        $this->assertEnabled();
        $this->assertQuota($user, self::FEATURE_SERVICE_DESCRIPTION);

        $business = $user->business;
        $sector = str_replace('_', ' ', (string) $business->sector);
        $city = $business->city;

        $systemPrompt = 'Eres un copywriter especializado en negocios locales españoles. Escribes en español de España, con un tono cercano y profesional, sin sonar a folleto publicitario. Para precios, sugieres rangos orientativos en euros según el sector y la ciudad del negocio, sin inventar ofertas ni descuentos.';

        $userPromptParts = [
            "Nombre del servicio: {$serviceName}",
            "Nombre del negocio: {$business->name}",
            "Sector: {$sector}",
        ];

        if ($city !== null && $city !== '') {
            $userPromptParts[] = "Ciudad: {$city}";
        }

        $userPromptParts[] = 'Genera una descripción corta del servicio de máximo 180 caracteres y un rango de precio orientativo en euros (mínimo y máximo, solo números). Responde EXACTAMENTE en este formato, separado por |||: descripción|||precio_mínimo|||precio_máximo. Sin numeración, sin comillas y sin texto adicional antes o después.';

        $raw = $this->provider->complete($systemPrompt, implode("\n", $userPromptParts));
        $parsed = $this->parseServiceDescriptionResponse($raw);

        $this->recordGeneration($user, self::FEATURE_SERVICE_DESCRIPTION);

        return $parsed;
    }

    public function improveText(User $user, string $text, string $tone, string $field): string
    {
        if (! in_array($tone, self::TONES, true) || ! in_array($field, self::FIELDS, true)) {
            throw new InvalidArgumentException('Parámetros no válidos.');
        }

        $this->assertEnabled();
        $this->assertQuota($user, self::FEATURE_IMPROVE_TEXT);

        $business = $user->business;
        $sector = str_replace('_', ' ', (string) $business->sector);
        $city = $business->city;
        $maxLength = $this->maxLengthForField($field);

        $systemPrompt = 'Eres un copywriter especializado en negocios locales españoles. Reescribes textos en español de España manteniendo el significado original, sin inventar datos concretos como años de experiencia, premios o direcciones.';

        $contextLine = "Negocio de {$sector}";
        if ($city !== null && $city !== '') {
            $contextLine .= " en {$city}";
        }

        $fieldLine = $field === 'tagline'
            ? 'Es un tagline (frase corta de gancho).'
            : 'Es una descripción del negocio.';

        $toneLine = match ($tone) {
            'profesional' => 'Tono profesional: serio, claro, sobrio. Sin coloquialismos.',
            'cercano' => "Tono cercano: cálido, en segunda persona del plural ('nosotros'/'os'), sin sonar a folleto.",
            'vendedor' => 'Tono vendedor: dinámico, orientado a beneficio para el cliente, con verbos de acción. Sin exageraciones ni superlativos vacíos.',
            default => throw new InvalidArgumentException('Tono no válido.'),
        };

        $userPrompt = implode("\n", [
            $contextLine.'.',
            $fieldLine,
            $toneLine,
            "Máximo {$maxLength} caracteres.",
            '"""'.$text.'"""',
            'Devuelve SOLO el texto reescrito, sin comillas, sin numeración, sin explicaciones.',
        ]);

        $raw = $this->provider->complete($systemPrompt, $userPrompt);
        $improved = $this->parseImprovedText($raw, $maxLength);

        $this->recordGeneration($user, self::FEATURE_IMPROVE_TEXT);

        return $improved;
    }

    /**
     * @return array{seo_title: string, seo_description: string}
     */
    public function generateBusinessSeoMeta(User $user, Business $business): array
    {
        $this->assertEnabled();
        $this->assertQuota($user, self::FEATURE_SEO_META);

        $sector = str_replace('_', ' ', (string) $business->sector);
        $city = $business->city;

        $systemPrompt = 'Eres un experto en SEO para negocios locales españoles. Escribes meta títulos y descripciones en español de España, claros y atractivos para buscadores, sin keyword stuffing ni datos inventados.';

        $userPromptParts = [
            "Nombre del negocio: {$business->name}",
            "Sector: {$sector}",
        ];

        if ($city !== null && $city !== '') {
            $userPromptParts[] = "Ciudad: {$city}";
        }

        $tagline = trim((string) ($business->tagline ?? ''));
        if ($tagline !== '') {
            $userPromptParts[] = "Tagline: {$tagline}";
        }

        $description = trim((string) ($business->description ?? ''));
        if ($description !== '') {
            $userPromptParts[] = "Descripción: {$description}";
        }

        $userPromptParts[] = 'Genera un meta título de máximo 55 caracteres y una meta descripción de máximo 150 caracteres para la página web del negocio. Responde EXACTAMENTE en este formato, separado por |||: título|||descripción. Sin numeración, sin comillas y sin texto adicional antes o después.';

        $raw = $this->provider->complete($systemPrompt, implode("\n", $userPromptParts));
        $parsed = $this->parseSeoMetaResponse($raw);

        $this->recordGeneration($user, self::FEATURE_SEO_META);

        return $parsed;
    }

    public function generateSocialPost(User $user, string $network, string $tone, ?string $topic): string
    {
        if (! in_array($network, self::NETWORKS, true) || ! in_array($tone, self::TONES, true)) {
            throw new InvalidArgumentException('Parámetros no válidos.');
        }

        $this->assertEnabled();
        $this->assertQuota($user, self::FEATURE_SOCIAL_POSTS);

        $business = $user->business;
        $sector = str_replace('_', ' ', (string) $business->sector);
        $city = $business->city;

        $systemPrompt = 'Eres un experto en redes sociales para negocios locales españoles. Escribes en español de España, con un tono adaptado a la red social, sin datos inventados (años de experiencia, premios, direcciones, cifras).';

        $networkLine = match ($network) {
            'instagram' => 'Red social: Instagram. Caption atractivo, máximo 300 caracteres, con 5 hashtags relevantes al final separados por espacio.',
            'facebook' => 'Red social: Facebook. Copy conversacional y cercano, máximo 400 caracteres, sin hashtags o máximo 2 al final.',
            'google_my_business' => 'Red social: Google My Business. Texto de actualización profesional, máximo 250 caracteres, sin hashtags.',
            default => throw new InvalidArgumentException('Red social no válida.'),
        };

        $toneLine = match ($tone) {
            'profesional' => 'Tono profesional: serio, claro, sobrio. Sin coloquialismos.',
            'cercano' => "Tono cercano: cálido, en primera persona del plural ('nosotros'/'os'), sin sonar a folleto.",
            'vendedor' => 'Tono vendedor: dinámico, orientado a beneficio para el cliente, con verbos de acción. Sin exageraciones ni superlativos vacíos.',
            default => throw new InvalidArgumentException('Tono no válido.'),
        };

        $userPromptParts = [
            "Nombre del negocio: {$business->name}",
            "Sector: {$sector}",
        ];

        if ($city !== null && $city !== '') {
            $userPromptParts[] = "Ciudad: {$city}";
        }

        $tagline = trim((string) ($business->tagline ?? ''));
        if ($tagline !== '') {
            $userPromptParts[] = "Tagline: {$tagline}";
        }

        $description = trim((string) ($business->description ?? ''));
        if ($description !== '') {
            $userPromptParts[] = "Descripción: {$description}";
        }

        $topicTrimmed = trim((string) ($topic ?? ''));
        if ($topicTrimmed !== '') {
            $userPromptParts[] = "Tema o contexto adicional: {$topicTrimmed}";
        }

        $userPromptParts[] = $networkLine;
        $userPromptParts[] = $toneLine;
        $userPromptParts[] = 'Devuelve SOLO el texto del post, sin comillas, sin numeración, sin explicaciones.';

        $raw = $this->provider->complete($systemPrompt, implode("\n", $userPromptParts));
        $text = mb_substr(trim($raw), 0, 600);

        if ($text === '') {
            throw new AiUnavailableException('No se pudo generar el post.');
        }

        $this->recordGeneration($user, self::FEATURE_SOCIAL_POSTS);

        return $text;
    }

    private function assertEnabled(): void
    {
        if (! config('ai.enabled') || config('ai.claude_api_key') === '') {
            throw new AiUnavailableException('La generación con IA no está habilitada.');
        }
    }

    private function assertQuota(User $user, string $feature): void
    {
        $limit = (int) config("ai.daily_limits.{$feature}", 0);
        $used = $this->countGenerationsSinceDayStart($user, $feature);

        if ($used >= $limit) {
            throw new AiQuotaExceededException($limit);
        }
    }

    private function recordGeneration(User $user, string $feature): void
    {
        AiGeneration::create([
            'user_id' => $user->id,
            'business_id' => $user->business_id,
            'feature' => $feature,
        ]);
    }

    private function countGenerationsSinceDayStart(User $user, string $feature): int
    {
        return AiGeneration::query()
            ->where('user_id', $user->id)
            ->where('feature', $feature)
            ->where('created_at', '>=', $this->quotaDayStart())
            ->count();
    }

    private function quotaDayStart(): Carbon
    {
        return now()->startOfDay();
    }

    /**
     * @return list<string>
     */
    private function parseVariants(string $raw): array
    {
        $parts = array_map('trim', explode('|||', $raw));
        $parts = array_values(array_filter($parts, fn (string $part) => $part !== ''));

        $variants = [];

        foreach (array_slice($parts, 0, 3) as $part) {
            $variants[] = mb_substr($part, 0, 280);
        }

        return $variants;
    }

    /**
     * @return array{description: string, suggested_price_min: ?float, suggested_price_max: ?float}
     */
    private function parseServiceDescriptionResponse(string $raw): array
    {
        $parts = array_map('trim', explode('|||', $raw));
        $description = mb_substr($parts[0] ?? '', 0, 180);

        if (trim($description) === '') {
            throw new AiUnavailableException('No se pudo generar la descripción del servicio.');
        }

        return [
            'description' => $description,
            'suggested_price_min' => $this->parseOptionalPrice($parts[1] ?? null),
            'suggested_price_max' => $this->parseOptionalPrice($parts[2] ?? null),
        ];
    }

    /**
     * @return array{seo_title: string, seo_description: string}
     */
    private function parseSeoMetaResponse(string $raw): array
    {
        $parts = array_map('trim', explode('|||', $raw));
        $title = mb_substr($parts[0] ?? '', 0, 60);
        $description = mb_substr($parts[1] ?? '', 0, 160);

        if (trim($title) === '' || trim($description) === '') {
            throw new AiUnavailableException('No se pudieron generar los meta tags SEO.');
        }

        return [
            'seo_title' => $title,
            'seo_description' => $description,
        ];
    }

    private function parseOptionalPrice(?string $value): ?float
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    private function maxLengthForField(string $field): int
    {
        return match ($field) {
            'tagline' => 120,
            'description' => 500,
            default => throw new InvalidArgumentException('Campo no válido.'),
        };
    }

    private function parseImprovedText(string $raw, int $maxLength): string
    {
        $text = trim($raw);

        if (
            (str_starts_with($text, '"') && str_ends_with($text, '"'))
            || (str_starts_with($text, "'") && str_ends_with($text, "'"))
        ) {
            $text = trim(mb_substr($text, 1, mb_strlen($text) - 2));
        }

        $text = mb_substr($text, 0, $maxLength);

        if (trim($text) === '') {
            throw new AiUnavailableException('No se pudo mejorar el texto.');
        }

        return $text;
    }
}
