<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = ['name', 'description', 'date', 'start_hour', 'end_hour'];

    public function eventPics()
    {
        return $this->hasMany(EventPic::class);
    }

    public function participants()
    {
        return $this->hasMany(EventParticipant::class);
    }

    public function attendances()
    {
        return $this->hasMany(EventAttendance::class);
    }

    public function getIsPastAttribute()
    {
        return now()->gt($this->date);
    }
}
