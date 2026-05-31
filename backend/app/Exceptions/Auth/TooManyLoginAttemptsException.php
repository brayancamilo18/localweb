<?php

namespace App\Exceptions\Auth;

use RuntimeException;

class TooManyLoginAttemptsException extends RuntimeException
{
    public function __construct(
        public int $secondsUntilRelease,
        string $message = 'Demasiados intentos de acceso.'
    ) {
        parent::__construct($message);
    }
}
