<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Student;
use Symfony\Component\HttpFoundation\Response;

class InjectStudentByQuery
{
    public function handle($request, Closure $next)
    {
        if ($request->has('student_id')) {
            $student = Student::find($request->get('student_id'));
            if ($student) {
                $request->attributes->set('current_student', $student);
            }
        }

        return $next($request);
    }
}
