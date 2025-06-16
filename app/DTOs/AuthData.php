<?php

namespace App\DTOs;

class AuthData
{
     private ?string $username;
     private ?string $password;

    public function __construct(array $data)
    {
        $this->username = $data['username'] ?? null;
        $this->password = $data['password'] ?? null;
    }

    /**
     * Get the value of username
     */
    public function getUsername(): ?string
    {
        return $this->username;
    }

    /**
     * Get the value of password
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }
}
