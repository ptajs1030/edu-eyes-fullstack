<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AuthRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends BaseApiController
{
    public function __construct(protected AuthService $service){}

    public function login(AuthRequest $data){
        return $this->success($this->service->login($data->getDto()));
    }

    public function logout(){
        return $this->success($this->service->logout());
    }
}
