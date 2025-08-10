<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemporaryClassStudent extends Model
{
    use HasFactory;

    protected $fillable = ['student_id', 'academic_year_id', 'initial_class_id', 'is_graduate'];

    public $timestamps = false;

    public function initialClass()
    {
        return $this->belongsTo(Classroom::class, 'initial_class_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }
}
