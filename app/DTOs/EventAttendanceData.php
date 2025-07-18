<?php

namespace App\DTOs;

class EventAttendanceData
{
    /**
     * Sample data
     */
     private ?string $qr_code;
     private ?string $submit_hour;
     private ?int $event_id;

    public function __construct(array $data)
    {
        $this->qr_code = $data['qr_code'] ?? null;
        $this->submit_hour = $data['submit_hour'] ?? null;
        $this->event_id = $data['event_id'] ?? null;
    }

    
    public function getStudent(): ?string
    {
        return $this->qr_code;
    }
    public function getSubmitHour(): ?string
    {
        return $this->submit_hour;
    }
    public function getEvent(): ?string
    {
        return $this->event_id;
    }
}