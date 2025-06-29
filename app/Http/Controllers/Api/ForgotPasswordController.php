<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ForgotPasswordRequest;
use App\Services\ForgotPasswordService;
use Illuminate\Http\Request;

class ForgotPasswordController extends BaseApiController
{
    public function __construct(protected ForgotPasswordService $service){}

    public function sendLink(ForgotPasswordRequest $data){
        return $this->success($this->service->sendLink($data->getDto()));
    }
}
