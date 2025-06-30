<?php

namespace App\DTOs;

class ForgotPasswordData
{
    /**
     * Sample data
     */
     private ?string $email;

    public function __construct(array $data)
    {
        $this->email = $data['email'] ?? null;
    }

    /**
     * Get the value of email
     */
    public function getEmail(): ?string
    {
        return $this->email;
    }
}