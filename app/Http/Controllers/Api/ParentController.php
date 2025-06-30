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

    public function getStudents(){
        return $this->resource(StudentResource::collection(Student::where('parent_id', auth()->user()->id)->get()));
    }

    public function getAnnouncements(?int $id = null)
    {
        if ($id) {
            return $this->resource(AnnouncementResource::make(Announcement::findOrFail($id)));
        }
        return $this->resource(AnnouncementResource::collection(Announcement::paginate(10)->getCollection()));
    }

    public function todayAttendance(Request $request){
        $student = $request->attributes->get('current_student');
       
        return $this->success($this->service->todayAttendance($student));
    }

    public function attendanceHistory(Request $request, ?string $date=null){

        $student = $request->attributes->get('current_student');
        
        return $this->success($this->service->attendanceHistory($date, $student));
    }
}
