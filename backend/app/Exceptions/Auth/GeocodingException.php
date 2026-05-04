<?php

namespace App\Exceptions\Auth;

use RuntimeException;

class GeocodingException extends RuntimeException
{
    public function __construct(string $message = 'Unable to geocode address.')
    {
        parent::__construct($message);
    }
}
