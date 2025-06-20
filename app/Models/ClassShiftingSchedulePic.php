<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassShiftingSchedulePic extends Model
{
    protected $fillable = [
        'class_shifting_schedule_id',
        'teacher_id'
    ];

    // not used timestamps
    public $timestamps = false;

    public function classShiftingSchedule()
    {
        return $this->belongsTo(ClassShiftingSchedule::class, 'class_shifting_schedule_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
