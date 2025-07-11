<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventParticipant extends Model
{
    protected $fillable = ['event_id', 'student_id'];

    // Relasi ke event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    // Relasi ke siswa
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
