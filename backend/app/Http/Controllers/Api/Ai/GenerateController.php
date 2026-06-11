<?php

namespace App\Http\Controllers\Api\Ai;

use App\Exceptions\Ai\AiQuotaExceededException;
use App\Exceptions\Ai\AiUnavailableException;
use App\Http\Controllers\Api\BaseApiController;
use App\Services\Ai\AiTextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class GenerateController extends BaseApiController
{
    public function businessDescription(Request $request, AiTextService $ai): JsonResponse
    {
        $validated = $request->validate([
            'business_name' => ['required', 'string', 'max:80'],
            'tagline' => ['nullable', 'string', 'max:120'],
        ], [
            'business_name.required' => 'El nombre del negocio es obligatorio.',
            'business_name.max' => 'El nombre del negocio no puede superar 80 caracteres.',
            'tagline.max' => 'El eslogan no puede superar 120 caracteres.',
        ]);

        if ($request->user()->business === null) {
            return $this->error('Negocio no encontrado', [], 404);
        }

        try {
            $result = $ai->generateBusinessDescription(
                $request->user(),
                $validated['business_name'],
                $validated['tagline'] ?? null,
            );

            return $this->success(['variants' => $result['variants']]);
        } catch (AiQuotaExceededException) {
            return $this->error('Has alcanzado el límite diario de generaciones con IA.', [], 429);
        } catch (AiUnavailableException) {
            return $this->error('La generación con IA no está disponible en este momento.', [], 503);
        }
    }

    public function serviceDescription(Request $request, AiTextService $ai): JsonResponse
    {
        $validated = $request->validate([
            'service_name' => ['required', 'string', 'max:100'],
        ], [
            'service_name.required' => 'El nombre del servicio es obligatorio.',
            'service_name.max' => 'El nombre del servicio no puede superar 100 caracteres.',
        ]);

        if ($request->user()->business === null) {
            return $this->error('Negocio no encontrado', [], 404);
        }

        try {
            $result = $ai->generateServiceDescription(
                $request->user(),
                $validated['service_name'],
            );

            return $this->success($result);
        } catch (AiQuotaExceededException) {
            return $this->error('Has alcanzado el límite diario de generaciones con IA.', [], 429);
        } catch (AiUnavailableException) {
            return $this->error('La generación con IA no está disponible en este momento.', [], 503);
        }
    }

    public function improveText(Request $request, AiTextService $ai): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'min:5', 'max:500'],
            'tone' => ['required', 'string', Rule::in(AiTextService::TONES)],
            'field' => ['required', 'string', Rule::in(AiTextService::FIELDS)],
        ], [
            'text.required' => 'Necesitamos al menos 5 caracteres para mejorar el texto.',
            'text.min' => 'Necesitamos al menos 5 caracteres para mejorar el texto.',
            'tone.in' => 'Tono no válido.',
            'field.in' => 'Campo no válido.',
        ]);

        if ($request->user()->business === null) {
            return $this->error('Negocio no encontrado', [], 404);
        }

        try {
            $result = $ai->improveText(
                $request->user(),
                $validated['text'],
                $validated['tone'],
                $validated['field'],
            );

            return $this->success(['text' => $result]);
        } catch (AiQuotaExceededException) {
            return $this->error('Has alcanzado el límite diario de generaciones con IA.', [], 429);
        } catch (AiUnavailableException) {
            return $this->error('La generación con IA no está disponible en este momento.', [], 503);
        } catch (InvalidArgumentException) {
            return $this->error('Parámetros no válidos', [], 422);
        }
    }

    public function socialPost(Request $request, AiTextService $ai): JsonResponse
    {
        $validated = $request->validate([
            'network' => ['required', 'string', Rule::in(AiTextService::NETWORKS)],
            'tone'    => ['required', 'string', Rule::in(AiTextService::TONES)],
            'topic'   => ['nullable', 'string', 'max:200'],
        ], [
            'network.required' => 'Elige una red social.',
            'network.in'       => 'Red social no válida.',
            'tone.in'          => 'Tono no válido.',
            'topic.max'        => 'El tema no puede superar 200 caracteres.',
        ]);

        if ($request->user()->business === null) {
            return $this->error('Negocio no encontrado', [], 404);
        }

        try {
            $text = $ai->generateSocialPost(
                $request->user(),
                $validated['network'],
                $validated['tone'],
                $validated['topic'] ?? null,
            );

            return $this->success(['text' => $text]);
        } catch (AiQuotaExceededException) {
            return $this->error('Has alcanzado el límite diario de generaciones con IA.', [], 429);
        } catch (AiUnavailableException) {
            return $this->error('La generación con IA no está disponible en este momento.', [], 503);
        } catch (InvalidArgumentException) {
            return $this->error('Parámetros no válidos', [], 422);
        }
    }

    public function quota(Request $request, AiTextService $ai): JsonResponse
    {
        return $this->success([
            'enabled' => config('ai.enabled') && config('ai.claude_api_key') !== '',
            'remaining' => $ai->remainingQuota($request->user()),
        ]);
    }
}
