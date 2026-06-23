<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->boolean('hero_cover_focal')->default(false)->after('hero_photo_slots');
        });

        DB::table('templates')->whereIn('slug', [
            'noir-elite',
            'bloom-studio',
            'tech-sleek',
        ])->update(['hero_cover_focal' => true]);
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn('hero_cover_focal');
        });
    }
};
