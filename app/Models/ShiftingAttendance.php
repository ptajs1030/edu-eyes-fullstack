<?php

namespace App\Models;

use Carbon\Carbon;
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

    protected $appends = [
        'shifting_start_hour_formatted',
        'shifting_end_hour_formatted',
        'clock_in_hour_formatted',
        'clock_out_hour_formatted',
    ];

    protected $casts = [
        'student_id' => 'integer',
        'class_id' => 'integer',
        'academic_year_id' => 'integer',
        'submit_date' => 'date',
        'minutes_of_late' => 'integer',
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

    // Formatted time
    public function getShiftingStartHourFormattedAttribute(): ?string
    {
        return $this->shifting_start_hour
            ? Carbon::parse($this->shifting_start_hour)->format('H:i')
            : null;
    }

    public function getShiftingEndHourFormattedAttribute(): ?string
    {
        return $this->shifting_end_hour
            ? Carbon::parse($this->shifting_end_hour)->format('H:i')
            : null;
    }

    public function getClockInHourFormattedAttribute(): ?string
    {
        return $this->clock_in_hour
            ? Carbon::parse($this->clock_in_hour)->format('H:i')
            : null;
    }

    public function getClockOutHourFormattedAttribute(): ?string
    {
        return $this->clock_out_hour
            ? Carbon::parse($this->clock_out_hour)->format('H:i')
            : null;
    }
}
