<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            // URLs largas (p. ej. Google Search/Reviews con query params extensos).
            $table->text('google_maps_url')->nullable()->change();
            $table->text('google_business_url')->nullable()->change();
            $table->text('booking_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('google_maps_url')->nullable()->change();
            $table->string('google_business_url')->nullable()->change();
            $table->string('booking_url')->nullable()->change();
        });
    }
};

