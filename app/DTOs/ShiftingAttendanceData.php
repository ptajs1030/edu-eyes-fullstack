<?php

namespace App\DTOs;

use Carbon\Carbon;

class ShiftingAttendanceData
{
    /**
     * Sample data
     */
     private ?int $stuent_id;
     private ?string $submit_hour;


    public function __construct(array $data)
    {
        $this->stuent_id = $data['student_id'] ?? null;
        $this->submit_hour = $data['submit_hour'] ?? null;
    }

    /**
     * Get the value of student_id
     */
    public function getStudent(): ?int
    {
        return $this->stuent_id;
    }

    public function getSubmitHour(): ?string
    {
        return $this->submit_hour;
    }
}