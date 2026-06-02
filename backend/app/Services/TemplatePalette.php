<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Template;

class TemplatePalette
{
    public function __construct(
        private readonly ColorDistance $colorDistance,
        private readonly TemplateContrast $contrast,
    ) {}

    /**
     * @return list<string>
     */
    public function forTemplate(?Template $template): array
    {
        if ($template === null) {
            return $this->normalizePalette(config('branding.fallback', []));
        }

        $palettes = config('branding.palettes', []);
        $slug = $template->slug;

        if (! isset($palettes[$slug])) {
            return $this->normalizePalette(config('branding.fallback', []));
        }

        return $this->normalizePalette($palettes[$slug]);
    }

    /**
     * @return list<string>
     */
    public function forBusiness(Business $business): array
    {
        return $this->forTemplate($business->template);
    }

    public function defaultColorFor(?Template $template): string
    {
        $palette = $this->forTemplate($template);

        return $palette[0];
    }

    public function resolveColor(Business $business): string
    {
        $stored = $business->brand_color;
        if ($stored === null) {
            return $this->defaultColorFor($business->template);
        }

        $normalized = strtolower($stored);
        if (preg_match('/^#[0-9a-f]{6}$/', $normalized) === 1) {
            return $normalized;
        }

        return $this->defaultColorFor($business->template);
    }

    /**
     * Aviso opcional cuando el color guardado puede verse mal; no impide guardarlo.
     */
    public function contrastWarningFor(?string $hex, ?Template $template): ?string
    {
        if ($hex === null) {
            return null;
        }

        $eval = $this->evaluateColor($hex, $template);
        if ($eval['ok']) {
            return null;
        }

        $reason = $eval['contrast']['reason'] ?? 'low_contrast';
        if ($reason === 'no_metadata') {
            return null;
        }

        return 'Puede que este color no se vea bien en tu plantilla. Puedes guardarlo igualmente.';
    }

    /**
     * Un color es aceptable para la plantilla si está en la paleta curada O
     * si pasa contraste WCAG con los colores de la plantilla. La paleta no
     * cambia: sigue siendo la lista curada que se muestra como sugerencia.
     *
     * @return array{ok: bool, in_palette: bool, contrast?: array<string, mixed>}
     */
    public function evaluateColor(string $hex, ?Template $template): array
    {
        $normalized = strtolower($hex);
        $inPalette = $this->isValidForTemplate($normalized, $template);
        if ($inPalette) {
            return ['ok' => true, 'in_palette' => true];
        }
        $contrast = $this->contrast->check($normalized, $template);

        return [
            'ok' => $contrast['ok'],
            'in_palette' => false,
            'contrast' => $contrast,
        ];
    }

    public function isValidForTemplate(string $hex, ?Template $template): bool
    {
        return in_array(strtolower($hex), $this->forTemplate($template), true);
    }

    public function isValidForBusiness(string $hex, Business $business): bool
    {
        return $this->isValidForTemplate($hex, $business->template);
    }

    /**
     * Color guardado listo para inyectar en la vista pública (Blade/HTML).
     * Cualquier #rrggbb válido guardado por el usuario Pro, no solo colores de la paleta curada.
     */
    public function brandColorForPublicView(Business $business): ?string
    {
        if ($this->cssVariableFor($business->template) === null) {
            return null;
        }

        $stored = $business->brand_color;
        if ($stored === null) {
            return null;
        }

        $normalized = strtolower($stored);
        if (preg_match('/^#[0-9a-f]{6}$/', $normalized) !== 1) {
            return null;
        }

        return $normalized;
    }

    public function isTemplateSupported(?Template $template): bool
    {
        if ($template === null) {
            return true;
        }

        $unsupported = config('branding.unsupported_templates', []);

        return ! in_array($template->slug, $unsupported, true);
    }

    /**
     * Devuelve el nombre de la variable CSS que actúa como "color de marca"
     * en cada plantilla. Sin el prefijo "var(", solo el identificador.
     *
     * Para plantillas no listadas devuelve null (no se inyecta sobreescritura).
     */
    public function cssVariableFor(?Template $template): ?string
    {
        if ($template === null) {
            return null;
        }

        return match ($template->slug) {
            'bloom-studio' => '--coral',
            'coastal-calm' => '--terracotta',
            'craft-pro' => '--orange',
            'graphite-soft' => '--accent',
            'luxe-atelier' => '--champagne',
            'mono-edito' => '--accent',
            'noir-elite' => '--gold',
            'la-republica-vintage' => '--red',
            'kairos-bold' => '--orange',
            'tavola-warm' => '--wine',
            'tech-sleek' => '--cyan',
            'trust-clinic' => '--accent',
            'urban-bold' => '--lime',
            'versa-studio' => '--warm',
            default => null,
        };
    }

    /**
     * @return array{
     *   current_color: string,
     *   current_in_new: bool,
     *   suggested_color: string,
     *   new_palette: list<string>,
     *   new_default: string,
     *   new_template_supported: bool,
     * }
     */
    public function previewChange(Business $business, Template $newTemplate): array
    {
        $newPalette = $this->forTemplate($newTemplate);
        $newDefault = $this->defaultColorFor($newTemplate);
        $stored = $business->brand_color !== null ? strtolower($business->brand_color) : null;

        if ($stored === null) {
            return [
                'current_color' => $this->resolveColor($business),
                'current_in_new' => false,
                'suggested_color' => $newDefault,
                'new_palette' => $newPalette,
                'new_default' => $newDefault,
                'new_template_supported' => $this->isTemplateSupported($newTemplate),
            ];
        }

        $currentInNew = $this->isValidForTemplate($stored, $newTemplate);
        $suggested = $currentInNew
            ? $stored
            : $this->colorDistance->closestInPalette($stored, $newPalette);

        return [
            'current_color' => $stored,
            'current_in_new' => $currentInNew,
            'suggested_color' => $suggested,
            'new_palette' => $newPalette,
            'new_default' => $newDefault,
            'new_template_supported' => $this->isTemplateSupported($newTemplate),
        ];
    }

    /**
     * @param  list<string>  $colors
     * @return list<string>
     */
    private function normalizePalette(array $colors): array
    {
        return array_map(
            static fn (string $color): string => strtolower($color),
            $colors,
        );
    }
}
