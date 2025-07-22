<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomDayOff extends Model
{
    protected $fillable = [
        'date',
        'description'
    ];
}
