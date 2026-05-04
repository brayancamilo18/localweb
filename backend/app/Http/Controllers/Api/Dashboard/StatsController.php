<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\PageVisit;
use App\Services\PlanService;
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

        $daily = PageVisit::query()
            ->where('business_id', $businessId)
            ->where('visited_at', '>=', now()->subDays($daysLimit))
            ->selectRaw('DATE(visited_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $total = (int) PageVisit::query()->where('business_id', $businessId)->count();
        $whatsapp = (int) PageVisit::query()->where('business_id', $businessId)->where('event_type', 'whatsapp_click')->count();
        $phone = (int) PageVisit::query()->where('business_id', $businessId)->where('event_type', 'phone_click')->count();

        return $this->success([
            'daily_visits' => $daily,
            'total' => $total,
            'days_limit' => $daysLimit,
            'whatsapp_clicks' => $whatsapp,
            'phone_clicks' => $phone,
        ]);
    }
}
