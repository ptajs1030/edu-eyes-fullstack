<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'curriculum_year', 'is_archived'];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    public function classSchedules()
    {
        return $this->hasMany(ClassSubjectSchedule::class);
    }

    public function classrooms()
    {
        return $this->belongsToMany(Classroom::class, 'class_subject_schedules')
            ->withPivot('teacher_id', 'day', 'start_hour', 'end_hour');
    }

    public function teachers()
    {
        return $this->belongsToMany(User::class, 'class_subject_schedules', 'subject_id', 'teacher_id')
            ->whereHas('role', function ($query) {
                $query->where('name', 'teacher');
            });
    }
}
