<?php

namespace App\Models;

use App\Enums\AcademicYearStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
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
                self::createClassHistory($student);
            }
        });

        static::updated(function (self $student) {
            if ($student->isDirty('class_id') && $student->class_id) {
                self::createClassHistory($student);
            }
        });
    }

    private static function createClassHistory(self $student)
    {
        $activeAcademicYear = AcademicYear::where('status', AcademicYearStatus::Active->value)->first();
        $classroom = Classroom::find($student->class_id);

        if (!$activeAcademicYear || !$classroom) {
            return;
        }

        ClassHistory::updateOrCreate(
            ['academic_year_id' => $activeAcademicYear->id, 'student_id' => $student->id],
            [
                'class_id' => $student->class_id,
                'class_name' => $classroom->name,
                'class_level' => $classroom->level,
            ]
        );
    }

    // Short functions
    public function getProfilePictureUrlAttribute()
    {
        if ($this->profile_picture) {
            return Storage::url($this->profile_picture);
        }
        return 'https://api.dicebear.com/9.x/initials/svg?seed=' . urlencode($this->full_name);
    }

    // Relations
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

    public function examAssignments()
    {
        return $this->hasMany(ExamAssignment::class);
    }

    public function paymentAssignments()
    {
        return $this->hasMany(PaymentAssignment::class);
    }

    public function taskAssignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function temporaryClassStudent()
    {
        return $this->hasOne(TemporaryClassStudent::class, 'student_id', 'id');
    }
}
