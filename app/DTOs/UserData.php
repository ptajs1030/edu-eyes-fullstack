<?php

namespace App\DTOs;

class UserData
{

     private ?string $fullName;
     private ?string $email;
     private ?string $username;
     private ?string $phone;
     private ?string $password;

    public function __construct(array $data)
    {
        $this->fullName = $data['full_name'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->username = $data['username'] ?? null;
        $this->phone = $data['phone'] ?? null;
        $this->password = $data['password'] ?? null;
    }

    /**
     * Get the value of fullName
     */
    public function getFullName(): ?string
    {
        return $this->fullName;
    }

    /**
     * Get the value of email
     */
    public function getEmail(): ?string
    {
        return $this->email;
    }

    /**
     * Get the value of username
     */
    public function getUsername(): ?string
    {
        return $this->username;
    }

    /**
     * Get the value of phone
     */
    public function getPhone(): ?string
    {
        return $this->phone;
    }

    /**
     * Get the value of password
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }
}
