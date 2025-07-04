<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'class_id',
        'academic_year_id',
        'subject_name',
        'subject_start_hour',
        'subject_end_hour',
        'submit_date',
        'submit_hour',
        'status',
        'note'
    ];

    protected $casts = [
        'submit_date' => 'date',
    ];

    // not used timestamps
    public $timestamps = false;

    public function student()
    {
        return $this->belongsTo(Student::class);
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
