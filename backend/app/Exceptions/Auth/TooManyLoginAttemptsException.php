<?php

namespace App\Exceptions\Auth;

use RuntimeException;

class TooManyLoginAttemptsException extends RuntimeException
{
    public function __construct(
        public int $secondsUntilRelease,
        string $message = 'Too many login attempts.'
    ) {
        parent::__construct($message);
    }
}
