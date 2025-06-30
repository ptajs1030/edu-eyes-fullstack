<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'class_shifting_schedule_id' => $this->class_shifting_schedule_id,
            'submit_date'=> $this->submit_date,
            'clock_in_hour' => $this->clock_in_hour,
            'clock_out_hour' => $this->clock_out_hour,
            'status' => $this->status,
            'minutes_of_late' => $this->minutes_of_late,
            'note'=> $this->note,
            'day_off_reason' => $this->day_off_reason,
            'date' => $this->date,
        ];
    }
}
