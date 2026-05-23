<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Un sector por plantilla (valores del registro en RegisterPage.tsx).
     *
     * @var array<string, list<string>>
     */
    private const SECTORS_BY_SLUG = [
        'urban-bold' => ['barberia'],
        'noir-elite' => ['restaurante'],
        'bloom-studio' => ['peluqueria'],
        'coastal-calm' => ['spa'],
        'craft-pro' => ['fisioterapia'],
        'tavola-warm' => ['cafeteria'],
        'tech-sleek' => ['tienda_ropa'],
        'trust-clinic' => ['clinica_dental'],
        'versa-studio' => ['estetica'],
        'mono-edito' => ['floristeria'],
        'luxe-atelier' => ['gimnasio'],
    ];

    public function up(): void
    {
        foreach (self::SECTORS_BY_SLUG as $slug => $sectors) {
            DB::table('templates')
                ->where('slug', $slug)
                ->update([
                    'suitable_sectors' => json_encode($sectors, JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        DB::table('templates')->update([
            'suitable_sectors' => null,
            'updated_at' => now(),
        ]);
    }
};
