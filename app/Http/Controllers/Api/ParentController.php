<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\ParentService;
use Illuminate\Http\Request;

class ParentController extends BaseApiController
{
    public function __construct(protected ParentService $service){}

    public function profile(){
        return $this->resource(UserResource::make(auth()->user()));
    }
}
