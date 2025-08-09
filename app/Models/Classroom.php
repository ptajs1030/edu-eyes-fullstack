<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classroom extends Model
{
    use SoftDeletes;

    protected $dates = ['deleted_at'];

    protected $fillable = [
        'main_teacher_id',
        'name',
        'level'
    ];

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function mainTeacher()
    {
        return $this->belongsTo(User::class, 'main_teacher_id');
    }

    public function classHistories()
    {
        return $this->hasMany(ClassHistory::class, 'class_id');
    }

    public function shiftingSchedules()
    {
        return $this->hasMany(ClassShiftingSchedule::class, 'class_id');
    }

    public function shiftingAttendances()
    {
        return $this->hasMany(ShiftingAttendance::class, 'class_id');
    }

    public function subjectSchedules()
    {
        return $this->hasMany(ClassSubjectSchedule::class, 'class_id');
    }

    public function temporaryStatus()
    {
        return $this->hasOne(TemporaryClassStatus::class, 'class_id', 'id');
    }
}
