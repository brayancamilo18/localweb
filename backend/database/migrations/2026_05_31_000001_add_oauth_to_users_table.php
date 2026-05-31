<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('provider', 32)->nullable()->after('email');
            $table->string('provider_id', 191)->nullable()->after('provider');
            $table->string('avatar_url', 512)->nullable()->after('provider_id');
            $table->string('password')->nullable()->change();

            $table->unique(['provider', 'provider_id'], 'users_provider_unique');
        });
    }

    public function down(): void
    {
        DB::table('users')->whereNull('password')->update(['password' => '']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_provider_unique');
            $table->dropColumn(['provider', 'provider_id', 'avatar_url']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
