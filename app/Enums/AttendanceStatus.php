<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case Present = 'present';
    case PresentInTolerance = 'present_in_tolerance';
    case Late = 'late';
    case Alpha = 'alpha';

    public function label(): string
    {
        return match ($this) {
            self::Present => 'Present',
            self::PresentInTolerance => 'Present In Tolerance',
            self::Late => 'Late',
            self::Alpha => 'Alpha',
        };
    }

    public static function getValues(): array
    {
        return array_map(fn($enum) => $enum->value, self::cases());
    }
}
