<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Exam;
use App\Models\ExamAssignment;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ExamSeeder extends Seeder
{
    public function run()
    {
        // Ambil data yang sudah ada dari database
        $academicYear = AcademicYear::where('status', 'active')->first();
        
        if (!$academicYear) {
            $this->command->error('Tidak ada tahun akademik aktif ditemukan!');
            return;
        }

        $subjects = Subject::all();
        if ($subjects->isEmpty()) {
            $this->command->error('Tidak ada mata pelajaran ditemukan!');
            return;
        }

        $classrooms = Classroom::all();
        if ($classrooms->isEmpty()) {
            $this->command->error('Tidak ada kelas ditemukan untuk tahun akademik ini!');
            return;
        }

        $students = Student::whereIn('class_id', $classrooms->pluck('id'))->get();
        if ($students->isEmpty()) {
            $this->command->error('Tidak ada siswa ditemukan di kelas yang tersedia!');
            return;
        }

        $examTypes = [
            ['name' => 'UTS Ganjil', 'type' => 'midterm'],
            ['name' => 'UAS Ganjil', 'type' => 'final'],
            ['name' => 'UTS Genap', 'type' => 'midterm'],
            ['name' => 'UAS Genap', 'type' => 'final'],
            ['name' => 'Quiz 1', 'type' => 'quiz'],
            ['name' => 'Quiz 2', 'type' => 'quiz'],
            ['name' => 'Tugas Praktik', 'type' => 'assignment'],
        ];

        foreach ($examTypes as $examType) {
            $subject = $subjects->random();
            
            $examDate = Carbon::now()
                ->subMonths(rand(1, 12))
                ->addDays(rand(1, 30))
                ->format('Y-m-d');

            $exam = Exam::create([
                'subject_id' => $subject->id,
                'academic_year_id' => $academicYear->id,
                'name' => $examType['name'],
                'type' => $examType['type'],
                'date' => $examDate,
            ]);

            $selectedClassrooms = $classrooms->random(rand(1, $classrooms->count()));
            
            foreach ($selectedClassrooms as $classroom) {
                $classStudents = $students->where('class_id', $classroom->id);
                
                foreach ($classStudents as $student) {
                    ExamAssignment::create([
                        'exam_id' => $exam->id,
                        'student_id' => $student->id,
                        'class_id' => $classroom->id,
                        'class_name' => $classroom->name,
                        'score' => $this->generateRealisticScore($examType['type']),
                    ]);
                }
            }
        }

        $this->command->info('Data ujian dan nilai berhasil ditambahkan!');
    }

    /**
     * Generate more realistic scores based on exam type
     */
    protected function generateRealisticScore(string $examType): float
    {
        return match ($examType) {
            'quiz' => rand(60, 90) + (rand(0, 99) / 100),
            'assignment' => rand(70, 95) + (rand(0, 99) / 100),
            'midterm' => rand(50, 85) + (rand(0, 99) / 100),
            'final' => rand(45, 90) + (rand(0, 99) / 100),
            default => rand(50, 100) + (rand(0, 99) / 100),
        };
    }
}