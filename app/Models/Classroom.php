<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{

    protected $fillable = [
        'main_teacher_id',
        'name',
        'level'
    ];

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function mainTeacher()
    {
        return $this->belongsTo(User::class, 'main_teacher_id');
    }

    public function academicYearHistories()
    {
        return $this->belongsToMany(AcademicYear::class, 'class_histories', 'class_id', 'academic_year_id')
            ->withPivot('student_id');
    }

    public function studentHistories()
    {
        return $this->belongsToMany(Student::class, 'class_histories', 'class_id', 'student_id')
            ->withPivot('academic_year_id');
    }
}
