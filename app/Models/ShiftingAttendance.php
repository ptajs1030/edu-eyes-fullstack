<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftingAttendance extends Model
{
    protected $fillable = [
        'student_id',
        'class_shifting_schedule_id',
        'submit_date',
        'status',
        'other_columns'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
