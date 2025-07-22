<?php

namespace App\Enums;

enum ShiftAttendanceStatus: string
{
    case Present = 'present';
    case PresentInTolerance = 'present_in_tolerance';
    case Alpha = 'alpha';
    case Late = 'late';
    case Leave = 'leave';
    case SickLeave = 'sick_leave';
    case DayOff = 'day_off';

    public function label(): string
    {
        return match ($this) {
            self::Present => 'Present',
            self::PresentInTolerance => 'Present In Tolerance',
            self::Alpha => 'Alpha',
            self::Late => 'Late',
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
