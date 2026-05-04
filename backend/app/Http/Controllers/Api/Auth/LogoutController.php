<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends BaseApiController
{
    public function __invoke(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();
        Auth::guard('web')->logout();

        return $this->success(['message' => 'Sesión cerrada']);
    }
}
