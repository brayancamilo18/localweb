<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->text('instagram_url')->nullable()->after('vcard_enabled');
            $table->text('tiktok_url')->nullable()->after('instagram_url');
            $table->text('facebook_url')->nullable()->after('tiktok_url');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['instagram_url', 'tiktok_url', 'facebook_url']);
        });
    }
};
