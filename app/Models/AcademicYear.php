<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $fillable = [
        'start_year',
        'title',
        'status',
        'attendance_mode',
        'note',
    ];

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
