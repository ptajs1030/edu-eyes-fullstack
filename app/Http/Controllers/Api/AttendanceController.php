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


    public function attendanceHistory(?string $date=null){
        $data = $this->service->attendanceHistory($date);
    
        return $this->success([
            'number_of_attendances' => $data['number_of_attendances'],
            'attendances' => AttendanceResource::collection($data['attendances'])
        ]);
    }

    public function shiftingAttendance(ShiftingAttendanceRequest $data){
      

        return $this->success( $this->service->shiftingAttendance($data->getDto()));
    }
}
