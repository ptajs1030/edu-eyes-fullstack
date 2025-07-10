<?php

namespace App\DTOs;

class SubjectAttendanceData
{
    /**
     * Sample data
     */
     private ?array $attendance_id_list;
    private ?string $submit_hour;

    public function __construct(array $data)
    {
        $this->attendance_id_list = $data['attendance_id_list'] ?? null;
        $this->submit_hour = $data['submit_hour'] ?? null;
    }

    /**
     * Get the value of phone
     */
    public function getAttendanceIdList(): ?array
    {
        return $this->attendance_id_list;
    }

    public function getSubmitHour(): ?string
    {
        return $this->submit_hour;
    }
}