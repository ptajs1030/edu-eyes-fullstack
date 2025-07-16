<?php

namespace App\DTOs;

class EditEventAttendanceData
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
     * Get the value of phone
     */
 
    public function getStatus(): ?string
    {
        return $this->status;
    }
}