<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemporaryClassStatus extends Model
{
    use HasFactory;

    protected $fillable = ['class_id', 'status'];

    public $timestamps = false;

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id', 'id');
    }
}
