<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ChangePasswordRequest;
use App\Http\Resources\ClassroomResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\SubjectResource;
use App\Http\Resources\UserResource;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\Subject;
use App\Services\TeacherService;
use Illuminate\Http\Request;

class TeacherController extends BaseApiController
{
/*************  ✨ Windsurf Command ⭐  *************/
    /**
     * TeacherController constructor.
     *
     * @param TeacherService $service
     */
/*******  0f0cb5bc-c783-47e5-aeff-8874c7e0bfda  *******/
    public function __construct(protected TeacherService $service)
    {
       
    }

    public function profile(){
        return $this->resource(UserResource::make(auth()->user()));
    }

    public function changePassword(ChangePasswordRequest $data){
        return $this->success($this->service->changePassword($data->getDto()));
    }

    public function getStudents(?int $id=null){
        if ($id) {
            return $this->resource(StudentResource::make(Student::findOrFail($id)));
        }
        return $this->resource(
            StudentResource::collection(Student::get()->paginate(10))
        );
    }

    public function getClassrooms(Request $request, ?int $id = null){
        if ($id) {
            return $this->resource(ClassroomResource::make(Classroom::findOrFail($id)));
        }
        
        $query = Classroom::query();
        $query->where('main_teacher_id', auth()->user()->id);
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('name', 'like', "%$search%");
        }
        $classrooms = $query->get();
        return $this->resource(
            ClassroomResource::collection($classrooms)
        );
    }

    public function getSubjects(?int $id = null){
        if ($id) {
            return $this->resource(SubjectResource::make(Subject::findOrFail($id)));
        }
        return $this->resource(
            SubjectResource::collection(Subject::get())
        );
    }
}
