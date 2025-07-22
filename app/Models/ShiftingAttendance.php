<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftingAttendance extends Model
{
    protected $fillable = [
        'student_id',
        'class_id',
        'academic_year_id',
        'shifting_name',
        'shifting_start_hour',
        'shifting_end_hour',
        'submit_date',
        'clock_in_hour',
        'clock_out_hour',
        'status',
        'minutes_of_late',
        'note',
        'day_off_reason',
    ];

    protected $casts = [
        'submit_date' => 'date',
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
