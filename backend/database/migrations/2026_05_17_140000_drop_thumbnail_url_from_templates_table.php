<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('templates', 'thumbnail_url')) {
            return;
        }

        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn('thumbnail_url');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('templates', 'thumbnail_url')) {
            return;
        }

        Schema::table('templates', function (Blueprint $table) {
            $table->string('thumbnail_url', 2048)->nullable()->after('primary_color');
        });
    }
};
