<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\StripeClient;

/**
 * Crea un nuevo Price de Stripe (los importes no se pueden editar en un Price existente).
 * Por defecto: 8,99 € / mes en el mismo producto que el Price actual de STRIPE_PRO_PRICE_ID.
 */
class StripeSyncProPrice extends Command
{
    protected $signature = 'stripe:sync-pro-price
                            {--amount=899 : Importe en céntimos (899 = 8,99 EUR)}
                            {--currency=eur : Moneda ISO}
                            {--product= : ID de producto Stripe (prod_…); si se omite, se infiere del Price en STRIPE_PRO_PRICE_ID}';

    protected $description = 'Crea en Stripe un precio mensual Pro (por defecto 8,99 €) e imprime STRIPE_PRO_PRICE_ID para .env';

    public function handle(): int
    {
        $secret = config('cashier.secret');
        if (! is_string($secret) || $secret === '') {
            $this->error('Configura STRIPE_SECRET en .env.');

            return self::FAILURE;
        }

        $stripe = new StripeClient($secret);
        $productOption = $this->option('product');
        $productId = is_string($productOption) ? trim($productOption) : '';

        if ($productId === '') {
            $oldPriceId = config('cashier.pro_price_id');
            if (! is_string($oldPriceId) || $oldPriceId === '') {
                $this->error('Indica --product=prod_… o define STRIPE_PRO_PRICE_ID para inferir el producto.');

                return self::FAILURE;
            }
            $oldPrice = $stripe->prices->retrieve($oldPriceId, []);
            $product = $oldPrice->product;
            $productId = is_string($product) ? $product : $product->id;
        }

        $amount = (int) $this->option('amount');
        $currency = strtolower((string) $this->option('currency'));

        if ($amount < 50) {
            $this->error('El importe en céntigos parece demasiado bajo. Usa 899 para 8,99 €.');

            return self::FAILURE;
        }

        $price = $stripe->prices->create([
            'product' => $productId,
            'currency' => $currency,
            'unit_amount' => $amount,
            'recurring' => ['interval' => 'month'],
        ]);

        $euros = number_format($amount / 100, 2, ',', '.');
        $this->info("Precio creado: {$price->id} ({$euros} {$currency}/mes, producto {$productId})");
        $this->newLine();
        $this->line('Añade o actualiza en .env:');
        $this->line('STRIPE_PRO_PRICE_ID='.$price->id);
        $this->newLine();
        $this->comment('Puedes archivar el precio antiguo en el dashboard de Stripe si ya no lo necesitas.');

        return self::SUCCESS;
    }
}
