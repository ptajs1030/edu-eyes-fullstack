<?php  

enum AcademicYearStatus: string 
{
    case Active = 'active';
    case Completed = 'completed';

    public function label(): string 
    {
        return match ($this) {
            self::Active => 'Active',
            self::Completed => 'Completed',
        };
    } 
}