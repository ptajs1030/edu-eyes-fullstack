<?php

namespace App\DTOs;

use Carbon\Carbon;

class ShiftingAttendanceData
{
    /**
     * Sample data
     */
     private ?string $status;


    public function __construct(array $data)
    {
        $this->status = $data['status'] ?? 'alpha'; 
       
    }

    /**
     * Get the value of student_id
     */
    public function getStudent(): ?int
    {
        return $this->stuent_id;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }
}