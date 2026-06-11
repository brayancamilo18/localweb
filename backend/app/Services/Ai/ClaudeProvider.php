<?php

namespace App\Services\Ai;

use Anthropic\Client;
use App\Exceptions\Ai\AiUnavailableException;
use Illuminate\Support\Facades\Log;
use Throwable;

class ClaudeProvider implements AiProviderContract
{
    private ?Client $client = null;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        private readonly int $timeoutSeconds,
    ) {
    }

    public function complete(string $systemPrompt, string $userPrompt): string
    {
        try {
            $client = $this->client();

            $message = $client->messages->create(
                maxTokens: 600,
                system: $systemPrompt,
                messages: [
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                model: $this->model,
            );

            // El SDK oficial expone $message->content como array de bloques tipados.
            // En respuestas de texto el primer bloque es de tipo "text".
            $blocks = $message->content ?? [];
            if (! is_array($blocks) || $blocks === []) {
                throw new AiUnavailableException('Respuesta vacía del proveedor de IA.');
            }

            $first = $blocks[0];
            $text = is_object($first) && property_exists($first, 'text') ? (string) $first->text : '';

            if (trim($text) === '') {
                throw new AiUnavailableException('Respuesta sin texto del proveedor de IA.');
            }

            return $text;
        } catch (AiUnavailableException $e) {
            // Ya formateada arriba: se relanza sin loguear de nuevo.
            throw $e;
        } catch (Throwable $e) {
            Log::warning('Claude API error', [
                'error' => $e->getMessage(),
                'class' => $e::class,
            ]);
            throw new AiUnavailableException('Proveedor de IA no disponible.', 0, $e);
        }
    }

    /**
     * Construye el cliente perezosamente: si la key está vacía no instanciamos
     * nada (AiTextService::assertEnabled ya corta antes de llegar aquí, pero
     * mantener esto evita errores de inicialización en tests/CI sin key).
     *
     * NOTA: el SDK oficial detecta el cliente HTTP PSR-18 vía php-http/discovery.
     * El `timeoutSeconds` se conserva en el property para una futura inyección
     * de un cliente HTTP con timeout custom; por ahora se usa el default del
     * SDK, que es razonable para Haiku (1–3 s de latencia típica).
     */
    private function client(): Client
    {
        if ($this->client !== null) {
            return $this->client;
        }

        if (trim($this->apiKey) === '') {
            throw new AiUnavailableException('API key de Anthropic no configurada.');
        }

        $this->client = new Client(apiKey: $this->apiKey);

        return $this->client;
    }
}
