<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AuthRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends BaseApiController
{
    public function __construct(protected AuthService $service){}

    /**
     * Handle an authentication attempt.
     *
     * @param  \App\Http\Requests\Api\AuthRequest  $data
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(AuthRequest $data){
        $response = $this->service->login($data->getDto());

        return $this->success($response);
    }

    /**
     * Logout the current user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(){
        return $this->success($this->service->logout());
    }

    public function helpCenter(){
        return $this->success($this->service->helpCenter());
    }
}
