<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Ruta del objeto en R2 (NO la URL pública). El resource la convierte con R2PublicUrl::forPath.
            if (! Schema::hasColumn('templates', 'thumbnail_url')) {
                $table->string('thumbnail_url', 2048)->nullable()->after('primary_color');
            }
            // Estado del pipeline de captura: pending|ready|failed.
            if (! Schema::hasColumn('templates', 'thumbnail_status')) {
                $table->string('thumbnail_status', 16)->default('pending')->after('thumbnail_url');
            }
            if (! Schema::hasColumn('templates', 'thumbnail_generated_at')) {
                $table->timestamp('thumbnail_generated_at')->nullable()->after('thumbnail_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            foreach (['thumbnail_generated_at', 'thumbnail_status', 'thumbnail_url'] as $column) {
                if (Schema::hasColumn('templates', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
