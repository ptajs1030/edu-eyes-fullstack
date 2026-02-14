<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    protected $dates = ['deleted_at'];

    protected $fillable = ['name', 'description', 'start_date', 'end_date', 'start_hour', 'end_hour'];

    protected static function booted()
    {
        static::deleting(function ($event) {
            $event->eventPics()->delete();
            $event->participants()->delete();
        });
    }

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
