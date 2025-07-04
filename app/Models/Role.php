<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Role extends Model
{
    use HasFactory;
    protected $fillable = [
        'name'
    ];

    // not used timestamps
    public $timestamps = false;

    public function role()
    {
        return $this->hasOne(User::class);
    }
}
