<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TaskAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'student_id',
        'class_id',
        'class_name',
        'score',
    ];

    protected $casts = [
        'task_id' => 'integer',
        'student_id' => 'integer',
        'class_id' => 'integer',
        'score' => 'float',
    ];

    // Relationships
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function class()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }
}
