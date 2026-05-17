<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\QrPosterRequest;
use App\Models\Business;
use App\Services\PublicPageUrlService;
use App\Services\QrCodeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class QrController extends BaseApiController
{
    public function __construct(
        private readonly PublicPageUrlService $urls,
        private readonly QrCodeService $qr,
    ) {}

    /**
     * GET /v1/qr/info
     * Metadata para que el frontend pinte una previsualización SIN consumir el endpoint pesado.
     */
    public function info(Request $request): JsonResponse
    {
        $business = $request->user()->business()->with('template')->first();

        if (! $business || ! $business->subdomain) {
            return $this->error('Aún no tienes una página publicada', [], 422);
        }

        $url = $this->urls->forBusiness($business);
        $defaultColor = $this->qr->colorForBusiness($business);

        return $this->success([
            'public_url' => $url,
            'is_pro' => (bool) $business->is_pro,
            'business_name' => $business->name,
            'tagline' => $business->tagline,
            'has_logo' => ! empty($business->logo_url),
            'default_color' => $defaultColor,
            'template_color' => $business->template?->primary_color,
        ]);
    }

    /**
     * GET /v1/qr/png?size=600&color=%231F2937
     * Descarga PNG. SOLO PRO.
     */
    public function png(Request $request): Response
    {
        $business = $request->user()->business()->with('template')->first();
        $gate = $this->assertPro($business);
        if ($gate) {
            return $gate;
        }

        $sizePx = (int) $request->query('size', 800);
        $sizePx = max(256, min(2048, $sizePx));

        $colorOverride = $request->query('color');
        if ($colorOverride !== null && ! preg_match('/^#[0-9a-fA-F]{6}$/', (string) $colorOverride)) {
            $colorOverride = null;
        }

        $color = $this->qr->colorForBusiness($business, $colorOverride);
        $bg = $this->qr->backgroundColorForBusiness($business);
        $url = $this->urls->forBusiness($business);
        $result = $this->qr->pngBinary($url, $sizePx, $color, $bg);

        $filename = 'qr-'.$business->subdomain.'.png';

        return response($result->getString(), 200, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * POST /v1/qr/poster
     * PDF imprimible. SOLO PRO. Si no se pasa `color`, hereda del template del negocio.
     */
    public function poster(QrPosterRequest $request): Response
    {
        $business = $request->user()->business()->with('template')->first();
        $gate = $this->assertPro($business);
        if ($gate) {
            return $gate;
        }

        $opts = $request->options();
        $url = $this->urls->forBusiness($business);

        $color = $this->qr->colorForBusiness($business, $opts['color']);
        $bg = $this->qr->backgroundColorForBusiness($business);

        $includeLogo = $opts['include_logo'] ?? ! empty($business->logo_url);
        $includeLogo = $includeLogo && ! empty($business->logo_url);

        $qrDataUri = $this->qr->pngDataUri($url, 600, $color, $bg);

        // dompdf no puede cargar URLs externas en muchos entornos. Priorizamos
        // el data URI que envía el frontend; si no, fallback a file_get_contents.
        $logoDataUri = null;
        if ($includeLogo && ! empty($business->logo_url)) {
            $frontendLogoUri = $request->input('logo_data_uri');
            if (is_string($frontendLogoUri) && str_starts_with($frontendLogoUri, 'data:image/')) {
                $logoDataUri = $frontendLogoUri;
            } else {
                try {
                    $imageContent = @file_get_contents($business->logo_url);
                    if ($imageContent !== false) {
                        $mime = 'image/png';
                        if (function_exists('getimagesizefromstring')) {
                            $info = @getimagesizefromstring($imageContent);
                            if ($info && isset($info['mime'])) {
                                $mime = $info['mime'];
                            }
                        }
                        $logoDataUri = 'data:'.$mime.';base64,'.base64_encode($imageContent);
                    }
                } catch (\Throwable) {
                    // Si falla la descarga del logo, el póster sale sin logo
                }
            }
        }

        $papers = [
            'a4' => ['paper' => 'a4', 'orientation' => 'portrait'],
            'a5' => ['paper' => 'a5', 'orientation' => 'portrait'],
            'square' => ['paper' => [0, 0, 595, 595], 'orientation' => 'portrait'],
        ];
        $paper = $papers[$opts['size']];

        $pdf = Pdf::loadView('pdf.qr-poster', [
            'businessName' => $business->name,
            'tagline' => $business->tagline,
            'message' => $opts['message'],
            'qrDataUri' => $qrDataUri,
            'publicUrl' => $url,
            'color' => $color,
            'logoDataUri' => ($includeLogo && $logoDataUri) ? $logoDataUri : null,
            'size' => $opts['size'],
        ])->setPaper($paper['paper'], $paper['orientation']);

        $filename = 'poster-qr-'.$business->subdomain.'.pdf';

        return $pdf->download($filename);
    }

    private function assertPro(?Business $business): ?Response
    {
        if (! $business || ! $business->subdomain) {
            return $this->error('Aún no tienes una página publicada', [], 422);
        }

        if (! $business->is_pro) {
            return $this->error('Necesitas el plan Pro para descargar el QR', [], 403);
        }

        return null;
    }
}
