<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'title',
        'description',
        'nominal',
        'due_date'
    ];

    protected $casts = [
        'academic_year_id' => 'integer',
        'due_date' => 'date',
        'nominal' => 'integer',
    ];

    // Relationships
    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function assignments()
    {
        return $this->hasMany(PaymentAssignment::class);
    }
}
