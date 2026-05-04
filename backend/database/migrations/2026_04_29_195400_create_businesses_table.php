<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('subdomain', 63)->unique();
            $table->enum('subdomain_type', ['random', 'custom'])->default('random');
            $table->string('sector', 60);
            $table->unsignedBigInteger('template_id')->nullable();
            $table->string('logo_path')->nullable();
            $table->text('description')->nullable();
            $table->string('tagline', 120)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('address')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->json('schedule')->nullable();
            $table->boolean('is_published')->default(false);
            $table->enum('plan', ['free', 'pro', 'pending'])->default('free');
            $table->timestamp('plan_activated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('business_id')->references('id')->on('businesses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['business_id']);
        });

        Schema::dropIfExists('businesses');
    }
};
