<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TaskService;
use Illuminate\Http\Request;

class TaskController extends BaseApiController
{
    public function __construct(protected TaskService $service){}

    public function getTasks(Request $request)
    {
        $student = $request->attributes->get('current_student');
        $search = $request->query('search');
        $subject = $request->query('subject');
        return $this->success($this->service->getTasks($student, $search, $subject));
    }

    public function getTaskDetails(Request $request, $id){
        $student= $request->attributes->get('current_student');
        return $this->success($this->service->getTaskDetail($id, $student));
    }
}
