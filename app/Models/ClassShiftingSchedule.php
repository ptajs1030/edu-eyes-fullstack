<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassShiftingSchedule extends Model
{
    protected $fillable = [
        'class_id',
        'shifting_id',
        'day',
    ];

    // not used timestamps
    public $timestamps = false;

    public function shifting()
    {
        return $this->belongsTo(Shifting::class, 'shifting_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    public function shiftingAttendances()
    {
        return $this->hasMany(ShiftingAttendance::class);
    }

    public function assignedTeachers()
    {
        return $this->belongsToMany(User::class, 'class_shifting_schedule_pics')
            ->using(ClassShiftingSchedulePic::class);
    }
}
