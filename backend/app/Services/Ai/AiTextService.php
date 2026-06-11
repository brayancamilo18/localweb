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

    public const FEATURE_BUSINESS_DESCRIPTION = 'business_description';

    public const FEATURE_SERVICE_DESCRIPTION = 'service_description';

    public const FEATURE_IMPROVE_TEXT = 'improve_text';

    public const FEATURE_SEO_META = 'seo_meta';

    public const FEATURE_SOCIAL_POSTS = 'social_posts';

    public const FEATURE_ABOUT_BLOCK = 'about_block_description';

    public const NETWORKS = ['instagram', 'facebook', 'google_my_business'];

    /** Etiquetas legibles para mostrar en el historial del usuario. */
    public const FEATURE_LABELS = [
        self::FEATURE_BUSINESS_DESCRIPTION => 'Descripción del negocio',
        self::FEATURE_SERVICE_DESCRIPTION  => 'Descripción de servicio',
        self::FEATURE_IMPROVE_TEXT         => 'Mejora de texto',
        self::FEATURE_SEO_META             => 'Meta SEO',
        self::FEATURE_SOCIAL_POSTS         => 'Post para redes sociales',
        self::FEATURE_ABOUT_BLOCK          => 'Bloque «Sobre nosotros»',
    ];

    public function __construct(
        private readonly AiProviderContract $provider,
    ) {}

    // ─── Cuota mensual global ─────────────────────────────────────

    /**
     * Devuelve el resumen de uso mensual del usuario.
     *
     * @return array{used: int, limit: int, remaining: int, resets_at: string}
     */
    public function monthlyUsageSummary(User $user): array
    {
        $limit = (int) config('ai.monthly_limit', 50);
        $used  = $this->countMonthlyGenerations($user);

        return [
            'used'      => $used,
            'limit'     => $limit,
            'remaining' => max(0, $limit - $used),
            'resets_at' => now()->startOfMonth()->addMonths(1)->toIso8601String(),
        ];
    }

    /**
     * Devuelve el historial de generaciones del mes actual (más recientes primero).
     *
     * @return list<array{feature: string, label: string, created_at: string}>
     */
    public function monthlyHistory(User $user, int $limit = 50): array
    {
        return AiGeneration::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $this->quotaMonthStart())
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['feature', 'created_at'])
            ->map(fn ($row) => [
                'feature'    => $row->feature,
                'label'      => self::FEATURE_LABELS[$row->feature] ?? $row->feature,
                'created_at' => Carbon::parse($row->created_at)->toIso8601String(),
            ])
            ->all();
    }

    /**
     * Cuota legacy por feature (usada en el endpoint /quota para compatibilidad).
     */
    public function remainingQuota(User $user): array
    {
        $summary = $this->monthlyUsageSummary($user);
        $remaining = $summary['remaining'];

        // Todos los features comparten el pool mensual global.
        $features = array_keys(self::FEATURE_LABELS);

        return array_fill_keys($features, $remaining);
    }

    // ─── Generadores ─────────────────────────────────────────────

    public function generateBusinessDescription(User $user, string $businessName, ?string $tagline): array
    {
        $this->assertEnabled();
        $this->assertMonthlyQuota($user);

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

        $userPromptParts[] = 'Genera primero un tagline (frase corta de gancho, máximo 100 caracteres) y luego EXACTAMENTE 3 variantes de descripción del negocio de entre 200 y 280 caracteres cada una. Separa los 4 elementos con el delimitador |||. El formato EXACTO debe ser: tagline|||descripción1|||descripción2|||descripción3. SIN numeración, sin comillas y sin texto adicional antes o después.';

        $raw = $this->provider->complete($systemPrompt, implode("\n", $userPromptParts));

        $parts = array_map('trim', explode('|||', $raw));
        $parts = array_values(array_filter($parts, fn (string $part) => $part !== ''));

        // El primer elemento es el tagline, los siguientes son variantes de descripción
        $suggestedTagline = mb_substr($parts[0] ?? '', 0, 120);
        $descriptionParts = array_slice($parts, 1);

        $variants = [];
        foreach (array_slice($descriptionParts, 0, 3) as $part) {
            $variants[] = mb_substr($part, 0, 280);
        }

        if ($variants === []) {
            throw new AiUnavailableException('No se pudieron generar variantes de descripción.');
        }

        $this->recordGeneration($user, self::FEATURE_BUSINESS_DESCRIPTION);

        return [
            'suggested_tagline' => $suggestedTagline,
            'variants'          => $variants,
        ];
    }

    /**
     * Genera el título y la descripción principal de «Sobre nosotros» en un solo
     * resultado (sin variantes). Usado en el dashboard.
     *
     * @return array{title: string, description: string}
     */
    public function generateMainAbout(
        User $user,
        string $businessName,
        ?string $tagline,
        ?string $currentTitle = null,
        ?string $currentDescription = null,
    ): array {
        $this->assertEnabled();
        $this->assertMonthlyQuota($user);

        $business = $user->business;
        $sector = str_replace('_', ' ', (string) $business->sector);
        $city = $business->city;

        $systemPrompt = 'Eres un copywriter especializado en negocios locales españoles. Escribes textos para la sección «Sobre nosotros» en español de España, con un tono cálido, cercano y auténtico, sin sonar a folleto publicitario. Nunca inventas datos concretos como años de experiencia, premios o direcciones.';

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

        $hasCurrentTitle = $currentTitle !== null && trim($currentTitle) !== '';
        $hasCurrentDescription = $currentDescription !== null && trim($currentDescription) !== '';

        if ($hasCurrentTitle || $hasCurrentDescription) {
            $userPromptParts[] = 'El usuario quiere REGENERAR el contenido actual. Debes proponer un título y una descripción COMPLETAMENTE NUEVOS: distintos en redacción, enfoque y estructura. No copies ni parafrasees el texto actual.';
            if ($hasCurrentTitle) {
                $userPromptParts[] = "Título actual (no reutilizar): {$currentTitle}";
            }
            if ($hasCurrentDescription) {
                $userPromptParts[] = "Descripción actual (no reutilizar): {$currentDescription}";
            }
        }

        $userPromptParts[] = 'Genera un título corto y evocador (máximo 80 caracteres) y una descripción del negocio de entre 200 y 280 caracteres para la sección «Sobre nosotros». Responde EXACTAMENTE en este formato, separado por |||: título|||descripción. Sin numeración, sin comillas y sin texto adicional antes o después.';

        $raw = $this->provider->complete($systemPrompt, implode("\n", $userPromptParts));

        $parts = array_map('trim', explode('|||', $raw));
        $title       = mb_substr($parts[0] ?? '', 0, 160);
        $description = mb_substr($parts[1] ?? '', 0, 500);

        if (trim($description) === '') {
            throw new AiUnavailableException('No se pudo generar la sección «Sobre nosotros».');
        }

        $this->recordGeneration($user, self::FEATURE_BUSINESS_DESCRIPTION);

        return [
            'title'       => $title,
            'description' => $description,
        ];
    }

    /**
     * @return array{description: string, suggested_price_min: ?float, suggested_price_max: ?float}
     */
    public function generateServiceDescription(User $user, string $serviceName): array
    {
        $this->assertEnabled();
        $this->assertMonthlyQuota($user);

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
        $this->assertMonthlyQuota($user);

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
        $this->assertMonthlyQuota($user);

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
        $this->assertMonthlyQuota($user);

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

    /**
     * Genera una descripción para un bloque extra de «Sobre nosotros».
     *
     * @return array{description: string}
     */
    public function generateAboutBlockDescription(User $user, ?string $blockTitle): array
    {
        $this->assertEnabled();
        $this->assertMonthlyQuota($user);

        $business = $user->business;
        $sector = str_replace('_', ' ', (string) $business->sector);
        $city = $business->city;

        $systemPrompt = 'Eres un copywriter especializado en negocios locales españoles. Escribes textos cortos y evocadores para secciones «Sobre nosotros» en español de España, con un tono cálido y auténtico. Nunca inventas datos concretos como años de experiencia, premios o direcciones.';

        $userPromptParts = [
            "Nombre del negocio: {$business->name}",
            "Sector: {$sector}",
        ];

        if ($city !== null && $city !== '') {
            $userPromptParts[] = "Ciudad: {$city}";
        }

        $tagline = trim((string) ($business->tagline ?? ''));
        if ($tagline !== '') {
            $userPromptParts[] = "Eslogan: {$tagline}";
        }

        $description = trim((string) ($business->description ?? ''));
        if ($description !== '') {
            $userPromptParts[] = "Descripción principal: {$description}";
        }

        $blockTitleTrimmed = trim((string) ($blockTitle ?? ''));
        if ($blockTitleTrimmed !== '') {
            $userPromptParts[] = "Título del bloque sugerido: {$blockTitleTrimmed}";
        }

        $userPromptParts[] = 'Genera un título corto y evocador (máximo 80 caracteres) y un texto descriptivo (máximo 400 caracteres) para este bloque. El texto debe ser diferente a la descripción principal, complementarla y aportar un ángulo nuevo (valores, equipo, proceso, filosofía…). Responde EXACTAMENTE en este formato, separado por |||: título|||descripción. Sin comillas, sin numeración, sin texto adicional antes o después.';

        $raw = $this->provider->complete($systemPrompt, implode("\n", $userPromptParts));

        $parts = array_map('trim', explode('|||', $raw));
        $title       = mb_substr($parts[0] ?? '', 0, 160);
        $description = mb_substr($parts[1] ?? '', 0, 500);

        if (trim($description) === '') {
            throw new AiUnavailableException('No se pudo generar el bloque.');
        }

        $this->recordGeneration($user, self::FEATURE_ABOUT_BLOCK);

        return [
            'title'       => $title,
            'description' => $description,
        ];
    }

    // ─── Internos ────────────────────────────────────────────────

    private function assertEnabled(): void
    {
        if (! config('ai.enabled') || config('ai.claude_api_key') === '') {
            throw new AiUnavailableException('La generación con IA no está habilitada.');
        }
    }

    private function assertMonthlyQuota(User $user): void
    {
        $limit = (int) config('ai.monthly_limit', 50);
        $used  = $this->countMonthlyGenerations($user);

        if ($used >= $limit) {
            throw new AiQuotaExceededException($limit);
        }
    }

    private function countMonthlyGenerations(User $user): int
    {
        return AiGeneration::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $this->quotaMonthStart())
            ->count();
    }

    private function quotaMonthStart(): Carbon
    {
        return now()->startOfMonth();
    }

    private function recordGeneration(User $user, string $feature): void
    {
        AiGeneration::create([
            'user_id'     => $user->id,
            'business_id' => $user->business_id,
            'feature'     => $feature,
        ]);
    }

    /**
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
            'description'          => $description,
            'suggested_price_min'  => $this->parseOptionalPrice($parts[1] ?? null),
            'suggested_price_max'  => $this->parseOptionalPrice($parts[2] ?? null),
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
            'seo_title'       => $title,
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
            'tagline'     => 120,
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
