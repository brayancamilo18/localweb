<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\JsonResponse;

class TenantExistsController extends Controller
{
    public function show(string $subdomain): JsonResponse
    {
        $exists = Business::query()
            ->where('subdomain', strtolower($subdomain))
            ->exists();

        if ($exists) {
            return response()->json(['exists' => true], 200);
        }

        return response()->json(['exists' => false], 404);
    }
}
