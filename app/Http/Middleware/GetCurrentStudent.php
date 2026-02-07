<?php

namespace App\Http\Middleware;

use App\Models\Student;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GetCurrentStudent
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $studentId= $request->header('X-Student-ID');
        $user = $request->user();

        if($studentId && $user){
            $student = Student::where('id', $studentId)->where('parent_id', $user->id)->first();
            if ($student) {
                $request->attributes->set('current_student', $student);
            }else {
                return response()->json(['error' => 'Student not found'], 404);
            }
        }else if (!$studentId && $user) {
            $student = Student::where('parent_id', $user->id)->first();
            if ($student) {
                $request->attributes->set('current_student', $student);
            } else {
                return response()->json(['message' => 'No student found for this user'], 404);
            }
        } 

        return $next($request);
    }
}
