<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Student extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $dates = ['deleted_at'];

    protected $guarded = [
        'id',
        'uuid',
        'qr_code_url',
        'created_at',
        'updated_at'
    ];

    protected static function booted()
    {
        static::creating(function ($student) {
            $student->uuid = $student->uuid ?: (string) Str::uuid();
        });

        static::created(function (self $student) {
            if (!is_null($student->class_id)) {
                $activeAcademicYear = AcademicYear::where('status', 'active')->first();
                $classroom = Classroom::findOrFail($student->class_id);

                ClassHistory::updateOrCreate(
                    ['academic_year_id' => $activeAcademicYear->id, 'student_id' => $student->id],
                    [
                        'class_id' => $student->class_id,
                        'class_name' => $classroom->name,
                        'class_level' => $classroom->level,
                    ]
                );
            }
        });
        static::updated(function (self $student) {
            if ($student->isDirty('class_id')) {
                $activeAcademicYear = AcademicYear::where('status', 'active')->first();
                $classroom = Classroom::findOrFail($student->class_id);

                ClassHistory::updateOrCreate(
                    ['academic_year_id' => $activeAcademicYear->id, 'student_id' => $student->id],
                    [
                        'class_id' => $student->class_id,
                        'class_name' => $classroom->name,
                        'class_level' => $classroom->level,
                    ]
                );
            }
        });
    }

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'class_id');
    }

    public function classHistories()
    {
        return $this->hasMany(ClassHistory::class);
    }

    public function shiftingAttendances()
    {
        return $this->hasMany(ShiftingAttendance::class);
    }

    public function subjectAttendances()
    {
        return $this->hasMany(SubjectAttendance::class);
    }

    public function eventParticipants()
    {
        return $this->hasMany(EventParticipant::class);
    }

    public function eventAttendances()
    {
        return $this->hasMany(EventAttendance::class);
    }
}
