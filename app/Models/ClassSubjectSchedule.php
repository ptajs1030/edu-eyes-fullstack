<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassSubjectSchedule extends Model
{
    use HasFactory;

    protected $fillable = ['class_id', 'subject_id', 'teacher_id', 'day', 'start_hour', 'end_hour'];

    protected $casts = [
        'class_id' => 'integer',
        'subject_id' => 'integer', 
        'teacher_id' => 'integer',
        'day' => 'integer',
    ];

    // not used timestamps
    public $timestamps = false;

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
