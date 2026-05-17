<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('templates', 'thumbnail_url')) {
            return;
        }

        DB::table('templates')
            ->whereNotNull('thumbnail_url')
            ->where(function ($q): void {
                $q->where('thumbnail_url', 'not like', 'https://%')
                    ->where('thumbnail_url', 'not like', 'http://%')
                    ->where('thumbnail_url', 'not like', '/%');
            })
            ->update(['thumbnail_url' => null]);
    }

    public function down(): void
    {
        // No reversible: URLs inválidas se descartan a propósito.
    }
};
