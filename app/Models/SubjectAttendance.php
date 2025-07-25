<?php

namespace App\Models;

use Carbon\Carbon;
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

    protected $appends = [
        'subject_start_hour_formatted',
        'subject_end_hour_formatted',
        'submit_hour_formatted',
    ];

    protected $casts = [
        'submit_date' => 'date',
    ];

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

    // Formatted time
    public function getSubjectStartHourFormattedAttribute(): ?string
    {
        return $this->subject_start_hour
            ? Carbon::parse($this->subject_start_hour)->format('H:i')
            : null;
    }

    public function getSubjectEndHourFormattedAttribute(): ?string
    {
        return $this->subject_end_hour
            ? Carbon::parse($this->subject_end_hour)->format('H:i')
            : null;
    }

    public function getSubmitHourFormattedAttribute(): ?string
    {
        return $this->submit_hour
            ? Carbon::parse($this->submit_hour)->format('H:i')
            : null;
    }
}
