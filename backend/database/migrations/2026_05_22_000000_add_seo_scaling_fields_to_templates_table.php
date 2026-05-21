<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->string('thumbnail_url', 255)->nullable()->after('hero_photo_slots');
            $table->string('category', 40)->nullable()->after('thumbnail_url');
            $table->json('suitable_sectors')->nullable()->after('category');
            $table->integer('sort_order')->default(100)->after('suitable_sectors');
            $table->boolean('featured')->default(false)->after('sort_order');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropIndex(['sort_order']);
            $table->dropColumn([
                'featured',
                'sort_order',
                'suitable_sectors',
                'category',
                'thumbnail_url',
            ]);
        });
    }
};
