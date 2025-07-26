<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskAttachment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class TaskSeeder extends Seeder
{
    public function run()
    {
        // Get existing data from database
        $academicYear = AcademicYear::where('status', 'active')->first();
        
        if (!$academicYear) {
            $this->command->error('No active academic year found!');
            return;
        }

        $subjects = Subject::all();
        if ($subjects->isEmpty()) {
            $this->command->error('No subjects found!');
            return;
        }

        $classrooms = Classroom::all();
        if ($classrooms->isEmpty()) {
            $this->command->error('No classrooms found for this academic year!');
            return;
        }

        $students = Student::whereIn('class_id', $classrooms->pluck('id'))->get();
        if ($students->isEmpty()) {
            $this->command->error('No students found in available classrooms!');
            return;
        }

        // Sample task types and descriptions
        $taskTypes = [
            [
                'title' => 'Essay Writing',
                'description' => 'Write a 500-word essay on the given topic',
                'url_examples' => [
                    'https://drive.google.com/document/d/123',
                    'https://docs.google.com/document/d/456'
                ]
            ],
            [
                'title' => 'Math Problem Set',
                'description' => 'Solve all the problems in chapter 3',
                'url_examples' => [
                    'https://drive.google.com/file/d/789',
                    'https://example.com/math-problems.pdf'
                ]
            ],
            [
                'title' => 'Science Project',
                'description' => 'Create a presentation about renewable energy',
                'url_examples' => [
                    'https://slides.google.com/presentation/d/101',
                    'https://example.com/science-project.pptx'
                ]
            ],
            [
                'title' => 'Reading Assignment',
                'description' => 'Read chapter 5 and summarize the key points',
                'url_examples' => [
                    'https://example.com/chapter5.pdf',
                    'https://drive.google.com/file/d/112'
                ]
            ],
        ];

        foreach ($taskTypes as $taskType) {
            $subject = $subjects->random();
            
            // Create task with due date in the future (1-30 days from now)
            $dueDate = Carbon::now()->addDays(rand(1, 30));
            
            $task = Task::create([
                'subject_id' => $subject->id,
                'academic_year_id' => $academicYear->id,
                'title' => $taskType['title'],
                'description' => $taskType['description'],
                'due_date' => $dueDate->format('Y-m-d'),
                'due_time' => $dueDate->copy()->setTime(rand(8, 16), rand(0, 1) ? 0 : 30)->format('H:i:s'),
            ]);

            // Add attachments to the task
            foreach ($taskType['url_examples'] as $url) {
                TaskAttachment::create([
                    'task_id' => $task->id,
                    'url' => $url,
                ]);
            }

            // Assign task to random classrooms
            $selectedClassrooms = $classrooms->random(rand(1, $classrooms->count()));
            
            foreach ($selectedClassrooms as $classroom) {
                $classStudents = $students->where('class_id', $classroom->id);
                
                foreach ($classStudents as $student) {
                    $isSubmitted = rand(0, 1); // 50% chance of being submitted
                    $isGraded = $isSubmitted && rand(0, 1); // 50% chance of being graded if submitted
                    
                    TaskAssignment::create([
                        'task_id' => $task->id,
                        'student_id' => $student->id,
                        'class_id' => $classroom->id,
                        'class_name' => $classroom->name,
                        'score' => $isGraded ? rand(60, 100) + (rand(0, 99) / 100) : null,
                    ]);
                }
            }
        }

        $this->command->info('Task system data seeded successfully!');
        $this->command->info(sprintf('Created %d tasks with assignments and attachments.', count($taskTypes)));
    }
}