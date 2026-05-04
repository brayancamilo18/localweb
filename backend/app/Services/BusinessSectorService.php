<?php

namespace App\Services;

class BusinessSectorService
{
    public function getAll(): array
    {
        return config('sectors', []);
    }

    public function exists(string $sector): bool
    {
        return in_array($sector, $this->getAll(), true);
    }
}
