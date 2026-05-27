<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            // NULL = usar el color por defecto de la plantilla. Formato '#rrggbb' en minúsculas.
            // Validación contra paleta se hace en capa de aplicación.
            $table->string('brand_color', 7)->nullable()->after('template_changed_at');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('brand_color');
        });
    }
};
