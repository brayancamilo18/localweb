<?php

namespace App\Http\Controllers\Api\Auth\Social;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\Request;

class SocialMeController extends BaseApiController
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        return $this->success([
            'provider' => $user->provider,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'business_id' => $user->business_id,
            'terms_accepted_at' => $user->terms_accepted_at,
        ]);
    }
}
