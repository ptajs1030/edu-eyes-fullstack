<?php

namespace App\DTOs;

use Carbon\Carbon;

class ShiftingAttendanceData
{
    /**
     * Sample data
     */
     private ?string $submit_hour;
     private ?string $qr_code;


    public function __construct(array $data)
    {
        $this->submit_hour = $data['submit_hour'];
        $this->qr_code = $data['qr_code']; 
       
    }

    /**
     * Get the value of student_id
     */
    public function getStudent(): ?string
    {
        return $this->qr_code;
    }

    public function getSubmitHour(): ?string
    {
        return $this->submit_hour;
    }
}