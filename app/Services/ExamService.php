<?php

namespace App\Services;

use App\Exceptions\SilentHttpException;
use App\Models\Exam;
use App\Models\ExamAssignment;
use App\Models\Subject;
use Carbon\Carbon;

class ExamService
{
    public function getSubject($student, $date, $search){
        $subjectQuery = Subject::query();
        $examQuery=ExamAssignment::query();
        $examQuery->where('student_id', $student->id);
        if ($date) {
            $parsedDate = Carbon::parse($date);
            $examQuery->whereHas('exam', function($q) use ($parsedDate) {
                $q->WhereYear('date', $parsedDate->year)->WhereMonth('date', $parsedDate->month);
            });
        }
        if ($search) {
            $subjectQuery->where('name', 'like', '%' . $search . '%');
        }
        $exams = $examQuery->get();
        if ($exams->isEmpty()) {
            throw new SilentHttpException(404, 'ujian tidak ditemukan');
        }
        $subjects=$subjectQuery->get();
        if ($subjects->isEmpty()) {
            throw new SilentHttpException(404, 'mapel tidak ditemukan');
        }   
        $totalUlangan=$exams->count();
        $totalNilai=$exams->sum('score');
        $rataRata=$totalNilai/$totalUlangan;
        return [
            'total_ulangan'=>$totalUlangan,
            'total_nilai'=>$totalNilai,
            'rata-rata'=>$rataRata,
            'subjects'=>$subjects
        ];
    }

    public function getExam($student, $date, $subject){
        $query=ExamAssignment::query();
        $query->where('student_id', $student->id);
        $query->whereHas('exam', function($q) use ($subject) {
            $q->where('subject_id', $subject);
        });
        if ($date) {
            $parsedDate = Carbon::parse($date);
            $query->whereHas('exam', function($q) use ($parsedDate) {
                $q->whereYear('date', $parsedDate->year)->whereMonth('date', $parsedDate->month);
            });
        }
        $exams=$query->with('exam')->get();
        if ($exams->isEmpty()) {
            throw new SilentHttpException(404, 'ujian tidak ditemukan');
        }

        $examsWithRelations = [];
        foreach ($exams as $i) {
            $examsWithRelations[] = [
                'id' => $i->id,
                'name' => $i->exam->name,
                'type' => $i->exam->type,
                'date' => $i->exam->date,
                'score' => $i->score,
            ];
        }

        $subject=Subject::find($subject)->value('name');
        $totalUlangan=$exams->count();
        $totalNilai=$exams->sum('score');
        $rataRata=$totalNilai/$totalUlangan;
        return [
            'subject'=>$subject,
            'total_ulangan'=>$totalUlangan,
            'total_nilai'=>$totalNilai,
            'rata-rata'=>$rataRata,
            'exams'=>$examsWithRelations
        ];

    }
}