<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('businesses', 'onboarding_completed_at')) {
            return;
        }

        Schema::table('businesses', function (Blueprint $table) {
            $table->timestamp('onboarding_completed_at')->nullable()->after('plan_activated_at');
        });

        // No tocar cuentas en Pro pendientes de pago (plan pending y aún no publicadas).
        DB::table('businesses')
            ->where(function ($q) {
                $q->where('plan', '!=', 'pending')
                    ->orWhere('is_published', true);
            })
            ->update([
                'onboarding_completed_at' => DB::raw('COALESCE(plan_activated_at, updated_at)'),
            ]);
    }

    public function down(): void
    {
        if (! Schema::hasColumn('businesses', 'onboarding_completed_at')) {
            return;
        }

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('onboarding_completed_at');
        });
    }
};
