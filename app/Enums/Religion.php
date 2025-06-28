<?php

namespace App\Enums;

enum Religion: string
{
    case Islam = 'islam';
    case Kristen = 'kristen';
    case Katolik = 'katolik';
    case Hindu = 'hindu';
    case Buddha = 'buddha';
    case Konghucu = 'konghucu';

    public function label(): string
    {
        return match ($this) {
            self::Islam => 'Islam',
            self::Kristen => 'Kristen',
            self::Katolik => 'Katolik',
            self::Hindu => 'Hindu',
            self::Buddha => 'Buddha',
            self::Konghucu => 'Konghucu',
        };
    }

    public static function getValues(): array
    {
        return array_map(fn($enum) => $enum->value, self::cases());
    }
}
