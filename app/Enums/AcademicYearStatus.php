<?php

namespace App\Enums;

enum AcademicYearStatus: string
{
    case Active = 'active';
    case Complete = 'complete';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Complete => 'Complete',
        };
    }

    public static function getValues(): array
    {
        return array_map(fn($mode) => $mode->value, self::cases());
    }
}
