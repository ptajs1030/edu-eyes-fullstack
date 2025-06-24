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
        static::saving(function (self $academicYear) {
            if ($academicYear->status === AcademicYearStatus::Active->value) {
                self::where('status', AcademicYearStatus::Active->value)->update(['status' => AcademicYearStatus::Complete->value]);
            }
        });
    }

    public function classroomHistories()
    {
        return $this->belongsToMany(Classroom::class, 'class_histories', 'academic_year_id', 'class_id')
            ->withPivot('student_id');
    }

    public function studentHistories()
    {
        return $this->belongsToMany(Student::class, 'class_histories', 'academic_year_id', 'student_id')
            ->withPivot('class_id');
    }
}
