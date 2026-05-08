<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseApiController;

class PingController extends BaseApiController
{
    public function __invoke()
    {
        return $this->success(['ok' => true]);
    }
}
