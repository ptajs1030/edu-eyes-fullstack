<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AuthRequest;
use App\Services\AuthTeacherService;
use Illuminate\Http\Request;

class AuthTeacherController extends BaseApiController
{
    public function __construct(protected AuthTeacherService $service){}

    public function login(AuthRequest $data){
        return $this->success($this->service->login($data->getDto()));
    }

    public function logout(){
        return $this->success($this->service->logout());
    }
}
