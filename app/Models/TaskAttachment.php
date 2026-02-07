<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TaskAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'url',
    ];

    protected $casts = [
        'task_id' => 'integer',
    ];

    // Relationships
    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
