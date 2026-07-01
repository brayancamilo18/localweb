<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->boolean('events_enabled')->default(false)->after('vcard_enabled');
        });

        Schema::create('business_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('title', 120);
            $table->dateTime('event_date');
            $table->string('location', 160)->nullable();
            $table->string('description', 500)->nullable();
            $table->string('image_path')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'event_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_events');

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('events_enabled');
        });
    }
};
