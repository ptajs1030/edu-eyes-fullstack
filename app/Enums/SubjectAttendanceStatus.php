<?php

namespace App\Enums;

enum SubjectAttendanceStatus: string
{
    case Present = 'present';
    case Alpha = 'alpha';
    case Leave = 'leave';
    case SickLeave = 'sick_leave';
    case DayOff = 'day_off';

    public function label(): string
    {
        return match ($this) {
            self::Present => 'Present',
            self::Alpha => 'Alpha',
            self::Leave => 'Leave',
            self::SickLeave => 'Sick Leave',
            self::DayOff => 'Day Off',
        };
    }

    public static function getValues(): array
    {
        return array_map(fn($enum) => $enum->value, self::cases());
    }
}
