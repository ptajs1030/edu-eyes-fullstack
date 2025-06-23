<?php

namespace App\Enums;

enum AttendanceMode: string 
{
    case PerShift = 'per-shift';
    case PerSubject = 'per-subject';

    public function label(): string
    {
        return match ($this) {
            self::PerShift => 'Per-shift',
            self::PerSubject => 'Per-subject',
        };
    }

    public static function getValues(): array
    {
        return array_map(fn($mode) => $mode->value, self::cases());
    }
}