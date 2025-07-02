<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shifting extends Model
{
    protected $fillable = [
        'name',
        'start_hour',
        'end_hour'
    ];

    public function classSchedules()
    {
        return $this->hasMany(ClassShiftingSchedule::class);
    }
}
