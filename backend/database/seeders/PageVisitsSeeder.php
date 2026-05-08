<?php

namespace Database\Seeders;

use App\Enums\EventType;
use App\Models\Business;
use App\Models\PageVisit;
use Illuminate\Database\Seeder;

class PageVisitsSeeder extends Seeder
{
    public function run(): void
    {
        $businesses = Business::query()->get(['id', 'subdomain']);

        if ($businesses->isEmpty()) {
            $this->command->warn('No hay negocios; nada que sembrar.');

            return;
        }

        $businessIds = $businesses->pluck('id')->all();
        // Limpiar datos previos para poder re-ejecutar el seeder de forma idempotente
        PageVisit::whereIn('business_id', $businessIds)->delete();

        $totalEntries = 0;

        foreach ($businesses as $business) {
            $entries = $this->buildEntriesFor((int) $business->id);

            foreach (array_chunk($entries, 200) as $chunk) {
                PageVisit::insert($chunk);
            }

            $totalEntries += count($entries);
        }

        $total = PageVisit::whereIn('business_id', $businessIds)->count();
        $visits = PageVisit::whereIn('business_id', $businessIds)->where('event_type', 'visit')->count();
        $whatsapp = PageVisit::whereIn('business_id', $businessIds)->where('event_type', 'whatsapp_click')->count();
        $phone = PageVisit::whereIn('business_id', $businessIds)->where('event_type', 'phone_click')->count();

        $this->command->info('✅ PageVisits seeded para '.$businesses->count().' negocios — '.$total.' registros');
        $this->command->info("   Visitas:  {$visits}");
        $this->command->info("   WhatsApp: {$whatsapp}");
        $this->command->info("   Teléfono: {$phone}");
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildEntriesFor(int $businessId): array
    {
        $entries = [];
        $now = now();

        for ($daysAgo = 89; $daysAgo >= 0; $daysAgo--) {
            $date = $now->copy()->subDays($daysAgo);
            $dayOfWeek = (int) $date->dayOfWeek; // 0=domingo, 6=sábado

            // Más tráfico entre semana, menos fines de semana
            $baseVisits = in_array($dayOfWeek, [0, 6], true) ? rand(2, 8) : rand(8, 28);

            // Picos aleatorios ocasionales (~15% de días)
            if (rand(1, 100) <= 15) {
                $baseVisits += rand(10, 25);
            }

            // Tendencia creciente: los últimos 30 días tienen más tráfico
            if ($daysAgo <= 30) {
                $baseVisits = (int) ($baseVisits * 1.4);
            }

            // Visitas: distribuidas a lo largo del día
            for ($i = 0; $i < $baseVisits; $i++) {
                $rawIp = '10.'.rand(0, 255).'.'.rand(0, 255).'.'.rand(1, 254);
                $entries[] = [
                    'business_id' => $businessId,
                    'event_type' => EventType::Visit->value,
                    'ip_hash' => $this->hashIpForSeed($rawIp),
                    'user_agent' => 'Mozilla/5.0 (Seed)',
                    'visited_at' => $date->copy()->setTime(rand(8, 22), rand(0, 59), rand(0, 59)),
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }

            // Clicks WhatsApp: ~40% de días tienen alguno (1-4 clicks)
            if (rand(1, 100) <= 40) {
                $waClicks = rand(1, 4);
                for ($i = 0; $i < $waClicks; $i++) {
                    $rawWaIp = '10.'.rand(0, 255).'.'.rand(0, 255).'.'.rand(1, 254);
                    $entries[] = [
                        'business_id' => $businessId,
                        'event_type' => EventType::WhatsappClick->value,
                        'ip_hash' => $this->hashIpForSeed($rawWaIp),
                        'user_agent' => 'Mozilla/5.0 (Seed)',
                        'visited_at' => $date->copy()->setTime(rand(9, 21), rand(0, 59), rand(0, 59)),
                        'created_at' => $date,
                        'updated_at' => $date,
                    ];
                }
            }

            // Clicks teléfono: ~25% de días tienen alguno (1-3 clicks)
            if (rand(1, 100) <= 25) {
                $phoneClicks = rand(1, 3);
                for ($i = 0; $i < $phoneClicks; $i++) {
                    $rawPhoneIp = '10.'.rand(0, 255).'.'.rand(0, 255).'.'.rand(1, 254);
                    $entries[] = [
                        'business_id' => $businessId,
                        'event_type' => EventType::PhoneClick->value,
                        'ip_hash' => $this->hashIpForSeed($rawPhoneIp),
                        'user_agent' => 'Mozilla/5.0 (Seed)',
                        'visited_at' => $date->copy()->setTime(rand(9, 21), rand(0, 59), rand(0, 59)),
                        'created_at' => $date,
                        'updated_at' => $date,
                    ];
                }
            }
        }

        return $entries;
    }

    /** Hash sintético para seed (sin guardar IP en claro). Si ANALYTICS_IP_SALT está vacío, ip_hash queda null. */
    private function hashIpForSeed(string $ip): ?string
    {
        $salt = (string) config('services.analytics.ip_salt', '');

        if ($salt === '') {
            return null;
        }

        return hash_hmac('sha256', $ip, $salt);
    }
}
