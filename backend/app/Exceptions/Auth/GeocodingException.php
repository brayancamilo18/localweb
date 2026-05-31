<?php

namespace App\Exceptions\Auth;

use RuntimeException;

class GeocodingException extends RuntimeException
{
    public function __construct(string $message = 'No se pudo localizar la dirección indicada.')
    {
        parent::__construct($message);
    }
}
