<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Teacher = 'teacher';
    case Parent = 'Parent';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Teacher => 'Teacher',
            self::Parent => 'Parent',
        };
    }

    public static function getValues(): array
    {
        return array_map(fn($enum) => $enum->value, self::cases());
    }
}
