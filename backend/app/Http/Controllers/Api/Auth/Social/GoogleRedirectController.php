<?php

namespace App\Http\Controllers\Api\Auth\Social;

use Illuminate\Routing\Controller;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;

class GoogleRedirectController extends Controller
{
    public function __invoke()
    {
        /** @var AbstractProvider $google */
        $google = Socialite::driver('google');

        return $google
            ->stateless()
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }
}
