<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Business;
use App\Models\PageVisit;
use App\Models\Template;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends BaseApiController
{
    /**
     * Métricas globales agregadas (sin series temporales).
     */
    public function overview()
    {
        $cutoff30 = now()->subDays(30);
        $cutoff60 = now()->subDays(60);

        $biz = Business::query()
            ->selectRaw(
                'COUNT(*) as total_businesses, '.
                'SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as total_published, '.
                'SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as total_unpublished, '.
                "SUM(CASE WHEN plan = 'free' THEN 1 ELSE 0 END) as plan_free, ".
                "SUM(CASE WHEN plan = 'pro' THEN 1 ELSE 0 END) as plan_pro, ".
                "SUM(CASE WHEN plan = 'pending' THEN 1 ELSE 0 END) as plan_pending, ".
                'SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_businesses_last_30d, '.
                'SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) as new_businesses_prev_30d',
                [$cutoff30, $cutoff60, $cutoff30]
            )
            ->first();

        $totalBusinesses = (int) ($biz->total_businesses ?? 0);
        $proCount = (int) ($biz->plan_pro ?? 0);

        $conversionRate = $totalBusinesses > 0
            ? round(($proCount / $totalBusinesses) * 100, 2)
            : 0.0;

        $visits = PageVisit::query()
            ->selectRaw(
                "SUM(CASE WHEN event_type = 'visit' AND visited_at >= ? THEN 1 ELSE 0 END) as total_visits_last_30d, ".
                "SUM(CASE WHEN event_type = 'visit' AND visited_at >= ? AND visited_at < ? THEN 1 ELSE 0 END) as visits_prev_30d, ".
                "SUM(CASE WHEN event_type = 'whatsapp_click' AND visited_at >= ? THEN 1 ELSE 0 END) as whatsapp_clicks_last_30d, ".
                "SUM(CASE WHEN event_type = 'phone_click' AND visited_at >= ? THEN 1 ELSE 0 END) as phone_clicks_last_30d",
                [$cutoff30, $cutoff60, $cutoff30, $cutoff30, $cutoff30]
            )
            ->first();

        $totalUsers = User::query()->count();

        return $this->success([
            'total_businesses' => $totalBusinesses,
            'total_published' => (int) ($biz->total_published ?? 0),
            'total_unpublished' => (int) ($biz->total_unpublished ?? 0),
            'total_users' => $totalUsers,
            'plan_breakdown' => [
                'free' => (int) ($biz->plan_free ?? 0),
                'pro' => $proCount,
                'pending' => (int) ($biz->plan_pending ?? 0),
            ],
            'conversion_rate' => $conversionRate,
            'new_businesses_last_30d' => (int) ($biz->new_businesses_last_30d ?? 0),
            'new_businesses_prev_30d' => (int) ($biz->new_businesses_prev_30d ?? 0),
            'total_visits_last_30d' => (int) ($visits->total_visits_last_30d ?? 0),
            'visits_prev_30d' => (int) ($visits->visits_prev_30d ?? 0),
            'whatsapp_clicks_last_30d' => (int) ($visits->whatsapp_clicks_last_30d ?? 0),
            'phone_clicks_last_30d' => (int) ($visits->phone_clicks_last_30d ?? 0),
        ]);
    }

    /**
     * Conteos por sector (todos los valores de config/sectors.php, aunque sea 0).
     */
    public function sectors()
    {
        $configured = config('sectors', []);

        $bySector = Business::query()
            ->select('sector')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published')
            ->selectRaw("SUM(CASE WHEN plan = 'free' THEN 1 ELSE 0 END) as free")
            ->selectRaw("SUM(CASE WHEN plan = 'pro' THEN 1 ELSE 0 END) as pro")
            ->groupBy('sector')
            ->get()
            ->keyBy('sector');

        $rows = collect($configured)
            ->map(function (string $sector) use ($bySector) {
                $row = $bySector->get($sector);

                return [
                    'sector' => $sector,
                    'total' => $row ? (int) $row->total : 0,
                    'published' => $row ? (int) $row->published : 0,
                    'free' => $row ? (int) $row->free : 0,
                    'pro' => $row ? (int) $row->pro : 0,
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->all();

        return $this->success(['sectors' => $rows]);
    }

    /**
     * Plantillas con uso (negocios no eliminados), incluidas inactivas.
     */
    public function templates()
    {
        $rows = Template::query()
            ->leftJoin('businesses', function ($join): void {
                $join->on('templates.id', '=', 'businesses.template_id')
                    ->whereNull('businesses.deleted_at');
            })
            ->select([
                'templates.id',
                'templates.name',
                'templates.slug',
                'templates.is_active',
                'templates.requires_pro',
            ])
            ->selectRaw('COUNT(businesses.id) as total_usage')
            ->groupBy(
                'templates.id',
                'templates.name',
                'templates.slug',
                'templates.is_active',
                'templates.requires_pro',
            )
            ->orderByDesc('total_usage')
            ->orderBy('templates.name')
            ->get();

        $templates = $rows->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'slug' => $t->slug,
            'is_active' => (bool) $t->is_active,
            'requires_pro' => (bool) $t->requires_pro,
            'total_usage' => (int) $t->total_usage,
        ])->values()->all();

        return $this->success(['templates' => $templates]);
    }

    /**
     * Negocios publicados con más actividad en page_visits (un solo SELECT agrupado).
     */
    public function topPages(Request $request)
    {
        $validated = $request->validate([
            'range' => ['sometimes', 'string', 'in:7d,30d,90d,all'],
            'event_type' => ['sometimes', 'string', 'in:visit,whatsapp_click,phone_click,all'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $range = $validated['range'] ?? '30d';
        $eventType = $validated['event_type'] ?? 'visit';
        $limit = (int) ($validated['limit'] ?? 20);

        $since = match ($range) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            'all' => null,
            default => now()->subDays(30),
        };

        $query = DB::table('page_visits')
            ->join('businesses', function ($join): void {
                $join->on('page_visits.business_id', '=', 'businesses.id')
                    ->whereNull('businesses.deleted_at')
                    ->where('businesses.is_published', '=', 1);
            });

        if ($since !== null) {
            $query->where('page_visits.visited_at', '>=', $since);
        }

        $query
            ->select(
                'businesses.id as business_id',
                'businesses.name',
                'businesses.subdomain',
                'businesses.sector',
                'businesses.plan',
            )
            ->selectRaw("SUM(CASE WHEN page_visits.event_type = 'visit' THEN 1 ELSE 0 END) as visits")
            ->selectRaw("SUM(CASE WHEN page_visits.event_type = 'whatsapp_click' THEN 1 ELSE 0 END) as whatsapp_clicks")
            ->selectRaw("SUM(CASE WHEN page_visits.event_type = 'phone_click' THEN 1 ELSE 0 END) as phone_clicks")
            ->groupBy(
                'businesses.id',
                'businesses.name',
                'businesses.subdomain',
                'businesses.sector',
                'businesses.plan',
            );

        match ($eventType) {
            'visit' => $query->orderByDesc('visits'),
            'whatsapp_click' => $query->orderByDesc('whatsapp_clicks'),
            'phone_click' => $query->orderByDesc('phone_clicks'),
            'all' => $query->orderByRaw('visits + whatsapp_clicks + phone_clicks DESC'),
            default => $query->orderByDesc('visits'),
        };

        $rows = $query->limit($limit)->get();

        $pages = $rows->map(fn ($r) => [
            'business_id' => (int) $r->business_id,
            'name' => $r->name,
            'subdomain' => $r->subdomain,
            'sector' => $r->sector,
            'plan' => (string) $r->plan,
            'visits' => (int) $r->visits,
            'whatsapp_clicks' => (int) $r->whatsapp_clicks,
            'phone_clicks' => (int) $r->phone_clicks,
        ])->all();

        return $this->success(['pages' => $pages]);
    }

    /**
     * Serie temporal agregada (registros o eventos de page_visits), sin huecos en el eje X.
     */
    public function timeSeries(Request $request)
    {
        $validated = $request->validate([
            'metric' => ['required', 'string', 'in:registrations,visits,whatsapp_clicks,phone_clicks'],
            'range' => ['sometimes', 'string', 'in:7d,30d,90d,365d'],
            'granularity' => ['sometimes', 'string', 'in:day,week,month'],
        ]);

        $rangeKey = $validated['range'] ?? '30d';
        $metric = $validated['metric'];
        $granularity = $validated['granularity'] ?? $this->defaultGranularityForRange($rangeKey);

        $end = Carbon::now()->endOfDay();
        /** Ventana inclusiva: N buckets diarios terminando hoy (p. ej. 7d → hoy + 6 días previos). */
        $start = match ($rangeKey) {
            '7d' => Carbon::now()->subDays(6)->startOfDay(),
            '30d' => Carbon::now()->subDays(29)->startOfDay(),
            '90d' => Carbon::now()->subDays(89)->startOfDay(),
            '365d' => Carbon::now()->subDays(364)->startOfDay(),
            default => Carbon::now()->subDays(29)->startOfDay(),
        };

        $bucketSql = $metric === 'registrations'
            ? $this->timeBucketSql('businesses.created_at', $granularity)
            : $this->timeBucketSql('page_visits.visited_at', $granularity);

        if ($metric === 'registrations') {
            $rows = DB::table('businesses')
                ->whereNull('deleted_at')
                ->whereBetween('created_at', [$start, $end])
                ->selectRaw("{$bucketSql} as bucket_date")
                ->selectRaw('COUNT(*) as value')
                ->groupByRaw($bucketSql)
                ->orderByRaw($bucketSql)
                ->get();
        } else {
            $eventType = match ($metric) {
                'visits' => 'visit',
                'whatsapp_clicks' => 'whatsapp_click',
                'phone_clicks' => 'phone_click',
                default => 'visit',
            };

            $rows = DB::table('page_visits')
                ->where('event_type', $eventType)
                ->whereBetween('visited_at', [$start, $end])
                ->selectRaw("{$bucketSql} as bucket_date")
                ->selectRaw('COUNT(*) as value')
                ->groupByRaw($bucketSql)
                ->orderByRaw($bucketSql)
                ->get();
        }

        $aggregates = [];
        foreach ($rows as $row) {
            if ($row->bucket_date === null) {
                continue;
            }
            $key = Carbon::parse($row->bucket_date)->format('Y-m-d');
            $aggregates[$key] = (int) $row->value;
        }

        $bucketKeys = $this->enumerateTimeBuckets($start, $end, $granularity);
        $points = [];
        foreach ($bucketKeys as $date) {
            $points[] = [
                'date' => $date,
                'value' => $aggregates[$date] ?? 0,
            ];
        }

        return $this->success([
            'granularity' => $granularity,
            'points' => $points,
        ]);
    }

    private function defaultGranularityForRange(string $rangeKey): string
    {
        return match ($rangeKey) {
            '7d', '30d' => 'day',
            '90d' => 'week',
            '365d' => 'month',
            default => 'day',
        };
    }

    /**
     * Etiqueta de bucket siempre como primer día (YYYY-MM-DD): día natural, lunes de semana o día 1 del mes.
     */
    private function timeBucketSql(string $column, string $granularity): string
    {
        $driver = DB::connection()->getDriverName();

        return match ($granularity) {
            'day' => match ($driver) {
                'sqlite' => "date({$column})",
                default => "DATE({$column})",
            },
            'week' => match ($driver) {
                'sqlite' => "date({$column}, '-' || (((cast(strftime('%w', {$column}) as integer) + 6) % 7)) || ' days')",
                default => "DATE_SUB(DATE({$column}), INTERVAL WEEKDAY({$column}) DAY)",
            },
            'month' => match ($driver) {
                'sqlite' => "date({$column}, 'start of month')",
                default => "DATE_FORMAT({$column}, '%Y-%m-01')",
            },
            default => match ($driver) {
                'sqlite' => "date({$column})",
                default => "DATE({$column})",
            },
        };
    }

    /**
     * @return list<string> Fechas YYYY-MM-DD de inicio de cada bucket en el rango.
     */
    private function enumerateTimeBuckets(Carbon $start, Carbon $end, string $granularity): array
    {
        $keys = [];

        if ($granularity === 'day') {
            for ($d = $start->copy()->startOfDay(); $d->lte($end); $d->addDay()) {
                $keys[] = $d->format('Y-m-d');
            }

            return $keys;
        }

        if ($granularity === 'week') {
            $cursor = $start->copy()->startOfWeek(Carbon::MONDAY);
            while ($cursor->lte($end)) {
                $keys[] = $cursor->format('Y-m-d');
                $cursor->addWeek();
            }

            return $keys;
        }

        $cursor = $start->copy()->startOfMonth();
        while ($cursor->lte($end)) {
            $keys[] = $cursor->format('Y-m-d');
            $cursor->addMonthNoOverflow();
        }

        return $keys;
    }
}
