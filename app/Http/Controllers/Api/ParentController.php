<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Services\ParentService;
use Illuminate\Http\Request;

class ParentController extends BaseApiController
{
    public function __construct(protected ParentService $service){}

    public function profile(){
        return $this->resource(UserResource::make(auth()->user()));
    }

    public function changePassword(ChangePasswordRequest $data){
        return $this->success($this->service->changePassword($data->getDto()));
    }
}
