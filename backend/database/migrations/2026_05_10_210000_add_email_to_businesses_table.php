<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Email público de contacto del negocio.
     *
     * Es independiente de `users.email` (credencial de login del owner): el
     * dueño puede querer mostrar en su web pública un correo distinto al que
     * usa para iniciar sesión (p. ej. una cuenta `info@…` o `reservas@…`).
     *
     * El onboarding (step 6) ya pedía y validaba `email` pero solo lo persistía
     * en el draft (cache). Esta columna lo lleva a la BD y lo expone en
     * `BusinessResource` / `PublicBusinessResource` para que el footer y la
     * sección «Cómo» de las plantillas lo rendericen.
     */
    public function up(): void
    {
        if (Schema::hasColumn('businesses', 'email')) {
            return;
        }

        Schema::table('businesses', function (Blueprint $table) {
            $table->string('email', 191)->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('businesses', 'email')) {
            return;
        }

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('email');
        });
    }
};
