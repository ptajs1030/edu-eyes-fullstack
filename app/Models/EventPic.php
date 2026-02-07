<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventPic extends Model
{
    protected $fillable = ['event_id', 'pic_id'];

    protected $casts = [
        'event_id' => 'integer',
        'pic_id' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'pic_id');
    }
}
