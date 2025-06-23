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
            'clock_in' => $this->clock_in,
            'clock_out' => $this->clock_out,
            'status' => $this->status,
            'minutes_of_late' => $this->minutes_of_late,
            'note'=> $this->note,
            'day_off_reason' => $this->day_off_reason,
            'class_id' => $this->class_id,
            'date' => $this->date,
        ];
    }
}
