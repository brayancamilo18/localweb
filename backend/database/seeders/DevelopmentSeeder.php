<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\BusinessImage;
use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        $template = Template::query()->where('slug', 'urban-bold')->firstOrFail();

        $business = Business::updateOrCreate(
            ['subdomain' => 'demo'],
            [
                'name' => 'ONEZ Demo',
                'subdomain_type' => 'random',
                'sector' => 'Servicios',
                'template_id' => $template->id,
                'description' => 'Negocio de ejemplo para desarrollo local.',
                'tagline' => 'Tu negocio en minutos',
                'phone' => '+51999999999',
                'address' => 'Dirección de prueba',
                'is_published' => true,
                'plan' => 'free',
            ]
        );

        $testUser = User::updateOrCreate(
            ['email' => 'test@localweb.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'business_id' => $business->id,
            ]
        );
        $testUser->forceFill(['is_admin' => false])->save();

        $adminUser = User::updateOrCreate(
            ['email' => 'admin@local.test'],
            [
                'name' => 'Admin Local',
                'password' => Hash::make('password'),
                'business_id' => null,
            ]
        );
        $adminUser->forceFill(['is_admin' => true])->save();

        $images = [
            ['path' => 'placeholders/cover.jpg', 'section' => 'cover', 'display_order' => 0],
            ['path' => 'placeholders/gallery-1.jpg', 'section' => 'gallery', 'display_order' => 1],
            ['path' => 'placeholders/about.jpg', 'section' => 'about', 'display_order' => 2],
        ];

        foreach ($images as $image) {
            BusinessImage::updateOrCreate(
                ['business_id' => $business->id, 'path' => $image['path']],
                $image + ['width' => 1200, 'height' => 800]
            );
        }

        $this->call(PageVisitsSeeder::class);
    }
}
