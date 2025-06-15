<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

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

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function teachers()
    {
        return $this->hasMany(Classroom::class);
    }

    public function academicYears()
    {
        return $this->belongsToMany(AcademicYear::class, 'class_histories', 'class_id', 'academic_year_id');
    }

    public function studentHistories()
    {
        return $this->belongsToMany(Student::class, 'class_histories', 'class_id', 'student_id');
    }

    public function shiftingAttendances()
    {
        return $this->hasMany(ShiftingAttendance::class, 'student_id');
    }

    public function classShiftingSchedulePics()
    {
        return $this->hasMany(ClassShiftingSchedulePic::class, 'teacher_id');
    }
}
