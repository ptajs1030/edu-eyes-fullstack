<?php

namespace App\DTOs;

class PasswordData
{
    /**
     * Sample data
     */
     private ?string $phone;

    public function __construct(array $data)
    {
        $this->phone = $data['phone'] ?? null;
    }

    /**
     * Get the value of phone
     */
    public function getPhone(): ?string
    {
        return $this->phone;
    }
}