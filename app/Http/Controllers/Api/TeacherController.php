<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherResource;
use App\Services\TeacherService;
use Illuminate\Http\Request;

class TeacherController extends BaseApiController
{
    public function __construct(TeacherService $service)
    {
       
    }

    public function profile(){
        return $this->resource(TeacherResource::make(auth()->user()));
    }
}
