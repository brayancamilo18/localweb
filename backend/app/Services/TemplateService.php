<?php

namespace App\Services;

use App\Models\Template;
use Illuminate\Support\Collection;

class TemplateService
{
    public function getActiveTemplates(): Collection
    {
        return Template::query()->active()->get();
    }

    public function getTemplatesForPlan(string $plan): Collection
    {
        $query = Template::query()->active();

        if ($plan !== 'pro') {
            $query->where('requires_pro', false);
        }

        return $query->get();
    }

    public function exists(int $id): bool
    {
        return Template::query()->whereKey($id)->exists();
    }

    public function findBySlug(string $slug): ?Template
    {
        return Template::query()->where('slug', $slug)->first();
    }
}
