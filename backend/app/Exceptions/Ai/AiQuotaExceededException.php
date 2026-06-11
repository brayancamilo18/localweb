<?php

namespace App\Exceptions\Ai;

class AiQuotaExceededException extends \RuntimeException
{
    public function __construct(int $limit)
    {
        parent::__construct("Has alcanzado el límite diario de {$limit} generaciones con IA.");
    }
}
