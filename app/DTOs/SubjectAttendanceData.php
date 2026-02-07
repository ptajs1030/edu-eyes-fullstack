<?php

namespace App\DTOs;

class SubjectAttendanceData
{
    /**
     * Sample data
     */
     private ?array $student_id_list;
    private ?string $submit_hour;
    private ?string $subject_name;
    private ?int $class_id;

    public function __construct(array $data)
    {
        $this->student_id_list = $data['student_id_list'] ?? null;
        $this->submit_hour = $data['submit_hour'] ?? null;
        $this->subject_name = $data['subject_name'] ?? null;
        $this->class_id = $data['class_id'] ?? null;
    }

    /**
     * Get the value of phone
     */
    public function getStudentIdList(): ?array
    {
        return $this->student_id_list;
    }

    public function getSubmitHour(): ?string
    {
        return $this->submit_hour;
    }

    public function getSubjectName(): ?string
    {
        return $this->subject_name;
    }

    public function getClassId(): ?int
    {
        return $this->class_id;
    }
}