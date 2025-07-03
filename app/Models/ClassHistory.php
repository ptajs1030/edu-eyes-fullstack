<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'class_id',
        'student_id',
    ];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function class()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
