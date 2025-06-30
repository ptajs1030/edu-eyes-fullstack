<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftingAttendance extends Model
{
    protected $fillable = [
        'student_id',
        'class_shifting_schedule_id',
        'submit_date',
        'minutes_of_late',
        'clock_in_hour',
        'clock_out_hour',
        'submit_hour',
        'status',
        'other_columns'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function classShiftingSchedule()
    {
        return $this->belongsTo(ClassShiftingSchedule::class, 'class_shifting_schedule_id');
    }
}
