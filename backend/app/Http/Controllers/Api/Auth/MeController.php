<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class MeController extends BaseApiController
{
    public function __invoke(Request $request)
    {
        $user = $request->user()->load('business.template', 'business.images');

        return $this->success([
            'user' => new UserResource($user),
            'business' => $user->business ? new BusinessResource($user->business) : null,
        ]);
    }
}
