<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'full_name',
        'username',
        'phone',
        'email',
        'password',
        'status'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'notification_key',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // helper to get teacher
    public function scopeTeachers($query)
    {
        return $query->whereHas('role', fn($q) => $q->where('name', 'teacher'));
    }

    // relation
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function children()
    {
        return $this->hasMany(Student::class, 'parent_id');
    }

    public function classrooms()
    {
        return $this->hasMany(Classroom::class, 'main_teacher_id');
    }

    public function shiftingSchedules()
    {
        return $this->belongsToMany(ClassShiftingSchedule::class, 'class_shifting_schedule_pics', 'teacher_id', 'class_shifting_schedule_id');
    }
}
