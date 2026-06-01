<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pro_drift_alerts')) {
            return;
        }

        Schema::create('pro_drift_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('stripe_customer_id', 64)->nullable();
            $table->string('plan_value', 16); // 'pro' | 'pending' | 'free'
            $table->string('drift_type', 48); // 'pro_without_subscription' | 'free_with_subscription' | 'pending_stale' | 'no_owner'
            $table->string('subscription_status', 32)->nullable();
            $table->timestamp('plan_activated_at')->nullable();
            $table->timestamp('detected_at')->index();
            $table->timestamp('resolved_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'drift_type', 'resolved_at'], 'pda_b_t_r_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pro_drift_alerts');
    }
};
