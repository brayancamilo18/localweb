<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla analítica: se trunca para no conservar IPs en claro. Alternativa en producción:
     * migrar filas existentes con hash_hmac('sha256', ip, salt) antes del rename (más costoso).
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('page_visits')->truncate();
        Schema::enableForeignKeyConstraints();

        Schema::table('page_visits', function (Blueprint $table) {
            $table->dropColumn('ip');
        });

        Schema::table('page_visits', function (Blueprint $table) {
            $table->string('ip_hash', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('page_visits', function (Blueprint $table) {
            $table->dropColumn('ip_hash');
        });

        Schema::table('page_visits', function (Blueprint $table) {
            $table->string('ip', 45)->nullable();
        });
    }
};
