<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\PageVisit;
use App\Services\PlanService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StatsController extends BaseApiController
{
    public function __invoke(Request $request, PlanService $plans)
    {
        $user = $request->user();
        if (! $plans->canAccessAnalytics($user)) {
            return response()->json(['upgrade_required' => true], 403);
        }

        $daysLimit = $plans->getAnalyticsDaysLimit($user);
        $businessId = $user->business->id;

        $from = $request->query('from')
            ? Carbon::parse($request->query('from'))->startOfDay()
            : now()->subDays($daysLimit)->startOfDay();

        $to = $request->query('to')
            ? Carbon::parse($request->query('to'))->endOfDay()
            : now()->endOfDay();

        $minFrom = now()->subDays($daysLimit)->startOfDay();
        if ($from->lt($minFrom)) {
            $from = $minFrom;
        }

        if ($from->gt($to)) {
            $to = $from->copy()->endOfDay();
        }

        $granularity = $request->query('granularity') === 'hour' ? 'hour' : 'day';

        $baseQuery = function (string $eventType) use ($businessId, $from, $to, $granularity) {
            $query = PageVisit::query()
                ->where('business_id', $businessId)
                ->where('event_type', $eventType)
                ->whereBetween('visited_at', [$from, $to]);

            if ($granularity === 'hour') {
                // Mantener `date` (compat) + `bucket` con la fecha+hora truncada
                return $query
                    ->selectRaw("DATE_FORMAT(visited_at, '%Y-%m-%d %H:00:00') as bucket, DATE(visited_at) as `date`, count(*) as count")
                    ->groupBy('bucket', 'date')
                    ->orderBy('bucket')
                    ->get();
            }

            return $query
                ->selectRaw('DATE(visited_at) as bucket, DATE(visited_at) as `date`, count(*) as count')
                ->groupBy('bucket', 'date')
                ->orderBy('bucket')
                ->get();
        };

        $daily = $baseQuery('visit');
        $dailyWa = $baseQuery('whatsapp_click');
        $dailyPhone = $baseQuery('phone_click');

        $total = (int) PageVisit::query()
            ->where('business_id', $businessId)
            ->where('event_type', 'visit')
            ->count();
        $whatsapp = (int) PageVisit::query()
            ->where('business_id', $businessId)
            ->where('event_type', 'whatsapp_click')
            ->count();
        $phone = (int) PageVisit::query()
            ->where('business_id', $businessId)
            ->where('event_type', 'phone_click')
            ->count();

        return $this->success([
            'daily_visits' => $daily,
            'daily_whatsapp_clicks' => $dailyWa,
            'daily_phone_clicks' => $dailyPhone,
            'total' => $total,
            'days_limit' => $daysLimit,
            'whatsapp_clicks' => $whatsapp,
            'phone_clicks' => $phone,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'granularity' => $granularity,
        ]);
    }
}
