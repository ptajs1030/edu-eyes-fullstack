<?php

namespace App\DTOs;

use Carbon\Carbon;

class ShiftingAttendanceData
{
    /**
     * Sample data
     */
     private ?string $submit_hour;
     private ?int $student_id;


    public function __construct(array $data)
    {
        $this->submit_hour = $data['submit_hour'];
        $this->student_id = $data['student_id']; 
       
    }

    /**
     * Get the value of student_id
     */
    public function getStudent(): ?int
    {
        return $this->student_id;
    }

    public function getSubmitHour(): ?string
    {
        return $this->submit_hour;
    }
}