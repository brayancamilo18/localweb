<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referred_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('referred_email')->nullable();
            $table->enum('status', ['registered', 'paid', 'rewarded', 'expired'])->default('registered');
            $table->timestamp('first_payment_at')->nullable();
            $table->timestamp('rewarded_at')->nullable();
            $table->string('stripe_invoice_id')->nullable();
            $table->timestamps();

            $table->index(['referrer_user_id', 'status']);
            $table->unique('stripe_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
