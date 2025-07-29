<?php

namespace App\DTOs;

use App\Models\User;

class NotifData
{
    public function __construct(
        public string $title,
        public string $body,
        public ?string $image_url,
        public ?array $data,
        public ?array $options,
        public User $user // receipient
    ) {}
}
