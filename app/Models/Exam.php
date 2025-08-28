<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'academic_year_id',
        'name',
        'type',
        'date',
    ];

    protected $casts = [
        'subject_id' => 'integer',
        'academic_year_id' => 'integer',
        'date' => 'date',
    ];

    // Relationships
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function assignments()
    {
        return $this->hasMany(ExamAssignment::class);
    }
}
