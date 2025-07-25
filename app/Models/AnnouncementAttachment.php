<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AnnouncementAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'announcement_id',
        'url',
    ];

    // Relationships
    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }
}
