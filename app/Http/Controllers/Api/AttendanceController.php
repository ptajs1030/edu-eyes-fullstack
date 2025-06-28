<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ShiftingAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends BaseApiController
{
    public function __construct(protected AttendanceService $service){}


    public function clockInHistory(Request $request)
    {
        $class_id = $request->query('class_id');
        $date = $request->query('date');
        $data = $this->service->attendanceHistory($date, $class_id, 'in');

        return $this->success([
            'number_of_attendances' => $data['number_of_attendances'],
            'current_page' => $data['current_page'],
            'last_page' => $data['last_page'],
            'per_page' => $data['per_page'],
            'attendances' => AttendanceResource::collection($data['attendances']),
        ]);
    }

    public function clockOutHistory(Request $request)
    {
        $class_id = $request->query('class_id');
        $date = $request->query('date');
        $data = $this->service->attendanceHistory($date, $class_id, 'out');

        return $this->success([
            'number_of_attendances' => $data['number_of_attendances'],
            'current_page' => $data['current_page'],
            'last_page' => $data['last_page'],
            'per_page' => $data['per_page'],
            'attendances' => AttendanceResource::collection($data['attendances']),
            
        ]);
    }

    public function shiftingAttendance(?int $student_id){
        return $this->success( $this->service->shiftingAttendance($student_id));
    }

    public function editAttendance(ShiftingAttendanceRequest $data, ?int $attendance_id ){
        return $this->success($this->service->editAttendance($data->getDto(), $attendance_id));
    }
}
