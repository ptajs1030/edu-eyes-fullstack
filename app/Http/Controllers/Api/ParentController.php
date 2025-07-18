<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ChangePasswordRequest;
use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\UserResource;
use App\Models\Announcement;
use App\Models\Student;
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

    public function getStudents(?int $id = null){
        if ($id) {
            return $this->resource(
                StudentResource::make(
                    Student::with("classroom")->findOrFail($id)
                )
            );
        }else {
            return $this->resource(StudentResource::collection(Student::where('parent_id', auth()->user()->id)->with("classroom")->get()));
        }
    }

    public function getAnnouncements(Request $request, ?int $id = null )
    {
        return $this->success($this->service->getAnnouncements($id, $request->search));
    }

    public function todayAttendance(Request $request){
        $student = $request->attributes->get('current_student');
      
        return $this->success($this->service->todayAttendance($student));
    }

    public function attendanceHistory(Request $request,){
        $student = $request->attributes->get('current_student');
        $date = $request->query('date');
        return $this->success($this->service->attendanceHistory($date, $student));
    }

    public function subjectAttendanceHistory(Request $request,){
        $student = $request->attributes->get('current_student');
        $date = $request->query('date');
        return $this->success($this->service->subjectAttendanceHistory($date, $student));
    }

    public function getSubjectSchedule(Request $request){
        $student = $request->attributes->get('current_student');
        return $this->success($this->service->getSubjectSchedule($student));
    }
    public function getEventSchedule(Request $request){
        $student = $request->attributes->get('current_student');
        return $this->success($this->service->getEventSchedule($student));
    }
}
