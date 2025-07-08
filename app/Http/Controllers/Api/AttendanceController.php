<?php

namespace App\Http\Controllers\Api;

use App\DTOs\EditShiftingAttendanceData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\EditShiftingAttendanceRequest;
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
        $data = $this->service->shiftingAttendanceHistory($date, $class_id, 'in');

        return $this->success([
            'number_of_attendances' => $data['number_of_attendances'],
            'current_page' => $data['current_page'],
            'last_page' => $data['last_page'],
            'per_page' => $data['per_page'],
            'attendances' => $data['attendances'],
        ]);
    }

    public function clockOutHistory(Request $request)
    {
        $class_id = $request->query('class_id');
        $date = $request->query('date');
        $data = $this->service->shiftingAttendanceHistory($date, $class_id, 'out');

        return $this->success([
            'number_of_attendances' => $data['number_of_attendances'],
            'current_page' => $data['current_page'],
            'last_page' => $data['last_page'],
            'per_page' => $data['per_page'],
            'attendances' => $data['attendances'],
        ]);
    }

    public function shiftingAttendance(ShiftingAttendanceRequest $data){
        return $this->success( $this->service->shiftingAttendance($data->getDto()));
    }

    public function editAttendance(EditShiftingAttendanceRequest $data, ?int $attendance_id ){

        return $this->success($this->service->editShiftingAttendance($data->getDto(), $attendance_id));
    }

    public function subjectAttendanceHistory(Request $request){
        $class_id = $request->query('class_id');
        $date = $request->query('date');
        $subject = $request->query('subject');
        $data = $this->service->subjectAttendanceHistory($date, $class_id, $subject);
        return $this->success([
            'number_of_attendances' => $data['number_of_attendances'],
            'current_page' => $data['current_page'],
            'last_page' => $data['last_page'],
            'per_page' => $data['per_page'],
            'attendances' => $data['attendances'],
        ]);
    }

    public function getSubjectAttendance(int $class_id, string $subject){
        return $this->success($this->service->getSubjectAttendance($class_id, $subject));
    }
}
