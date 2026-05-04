<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('google_maps_url')->nullable()->after('lng');
            $table->string('google_business_url')->nullable()->after('google_maps_url');
            $table->string('booking_url')->nullable()->after('google_business_url');
            $table->boolean('vcard_enabled')->default(false)->after('booking_url');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn([
                'google_maps_url',
                'google_business_url',
                'booking_url',
                'vcard_enabled',
            ]);
        });
    }
};
