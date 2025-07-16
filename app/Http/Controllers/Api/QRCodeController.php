<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QRCodeService;
use Illuminate\Http\Request;

class QRCodeController extends BaseApiController
{
    public function __construct(protected QRCodeService $service)
    {
    }
    public function generate(){
        return $this->success($this->service->generate());
    }


}
