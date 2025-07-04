<?php

namespace App\Models;

use App\Enums\AcademicYearStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'start_year',
        'title',
        'status',
        'attendance_mode',
        'note',
    ];

    protected static function booted()
    {
        static::creating(function (self $academicYear) {
            if ($academicYear->status === AcademicYearStatus::Active->value) {
                self::where('status', AcademicYearStatus::Active->value)->update(['status' => AcademicYearStatus::Complete->value]);
            }
        });
    }

    public function classroomHistories()
    {
        return $this->hasMany(ClassHistory::class);
    }

    public function shiftingAttendances()
    {
        return $this->hasMany(ShiftingAttendance::class);
    }
}
