<?php

namespace App\DTOs;

class ChangePasswordData
{
    /**
     * Sample data
     */
     private ?string $old_password;
     private ?string $new_password;

    public function __construct(array $data)
    {
       $this->old_password = $data['old_password'] ?? null;
        $this->new_password = $data['new_password'] ?? null;
    }

   
    /**
     * Get the new password.
     *
     * @return string|null
     */
    public function getNewPassword(): ?string
    {
        return $this->new_password;
    }

    /**
     * Get the old password.
     *
     * @return string|null
     */

    public function getOldPassword(): ?string
    {
        return $this->old_password;
    }
}