<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->unsignedTinyInteger('about_sections_count')->default(1)->after('about_title');
        });

        Schema::create('business_about_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('display_order');
            $table->string('title', 160)->nullable();
            $table->string('description', 500)->nullable();
            $table->string('image_path')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_about_sections');

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('about_sections_count');
        });
    }
};
