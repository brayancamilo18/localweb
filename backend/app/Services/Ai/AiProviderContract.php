<?php

namespace App\Services\Ai;

interface AiProviderContract
{
    /**
     * Envía un prompt y devuelve el texto de respuesta del modelo.
     * Lanza AiUnavailableException si el proveedor falla o no responde a tiempo.
     */
    public function complete(string $systemPrompt, string $userPrompt): string;
}
