<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ExamAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'student_id',
        'class_id',
        'class_name',
        'score',
    ];

    protected $casts = [
        'exam_id' => 'integer',
        'student_id' => 'integer',
        'class_id' => 'integer',
        'score' => 'float',
    ];

    // Relationships
    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function class()
    {
        return $this->belongsTo(Classroom::class, 'class_id'); // Rename if your class model is not named ClassModel
    }
}
