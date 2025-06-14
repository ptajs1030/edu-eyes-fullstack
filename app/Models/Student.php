<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'qr_code_url',
        'created_at',
        'updated_at'
    ];

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    // kasdasnda
    public function academicYearHistories()
    {
        return $this->belongsToMany(AcademicYear::class, 'class_histories', 'student_id', 'academic_year_id')
            ->withPivot('class_id');
    }

    public function classroomHistories()
    {
        return $this->belongsToMany(Classroom::class, 'class_histories', 'student_id', 'class_id')
            ->withPivot('academic_year_id');
    }
}
