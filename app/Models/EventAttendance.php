<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventAttendance extends Model
{
    protected $fillable = [
        'student_id',
        'event_id',
        'academic_year_id',
        'submit_date',
        'clock_in_hour',
        'clock_out_hour',
        'status',
        'minutes_of_late',
        'note'
    ];

    protected $casts = [
        'student_id' => 'integer',
        'event_id' => 'integer',
        'academic_year_id' => 'integer',
        'minutes_of_late' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
