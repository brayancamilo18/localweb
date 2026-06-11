<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->nullable()->constrained()->nullOnDelete();
            $table->string('feature', 40)->index();
            $table->timestamp('created_at')->nullable();

            $table->index(['user_id', 'feature', 'created_at']);
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->string('seo_title', 80)->nullable()->after('description');
            $table->string('seo_description', 180)->nullable()->after('seo_title');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['seo_title', 'seo_description']);
        });

        Schema::dropIfExists('ai_generations');
    }
};
