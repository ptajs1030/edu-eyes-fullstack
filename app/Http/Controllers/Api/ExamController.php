<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExamService;
use Illuminate\Http\Request;

class ExamController extends BaseApiController
{
    public function __construct(protected ExamService $service){}

    public function getSubject(Request $request){
        $student= $request->attributes->get('current_student');
        $date= $request->query('date');
        $search= $request->query('search');
        return $this->success($this->service->getSubject($student, $date, $search));
    }

    public function getExam(Request $request, int $subject){
        $student= $request->attributes->get('current_student');
        $date=$request->query('date');
        return $this->success($this->service->getExam($student, $date, $subject));
    }
}
