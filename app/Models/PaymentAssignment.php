<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PaymentAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'student_id',
        'payment_date',
    ];

    protected $casts = [
        'payment_id' => 'integer',
        'student_id' => 'integer',
    ];

    // Relationships
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
