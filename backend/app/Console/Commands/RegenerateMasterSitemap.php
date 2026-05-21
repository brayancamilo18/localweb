<?php

namespace App\Console\Commands;

use App\Http\Controllers\PublicSitemapController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RegenerateMasterSitemap extends Command
{
    protected $signature = 'sitemap:regenerate-master';

    protected $description = 'Regenera y cachea el sitemap maestro de todos los negocios publicados';

    public function handle(): int
    {
        $this->info('Regenerando sitemap maestro...');

        Cache::forget('sitemap:master');

        $request = Request::create(
            'https://'.config('localweb.domains.root').'/sitemap-index.xml'
        );
        $controller = app(PublicSitemapController::class);
        $response = $controller->master($request);

        $content = $response->getContent();
        $businesses = substr_count($content, '<sitemap>');

        $this->info("Sitemap maestro regenerado: {$businesses} negocios incluidos.");

        return self::SUCCESS;
    }
}
