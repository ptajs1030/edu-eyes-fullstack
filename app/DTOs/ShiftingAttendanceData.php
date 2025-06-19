<?php

namespace App\DTOs;

class ShiftingAttendanceData
{
    /**
     * Sample data
     */
     private ?int $stuent_id;

    public function __construct(array $data)
    {
        $this->phone = $data['student_id'] ?? null;
    }

    /**
     * Get the value of phone
     */
    public function getStudent(): ?int
    {
        return $this->stuent_id;
    }
}