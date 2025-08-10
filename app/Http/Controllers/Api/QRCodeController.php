<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QRCodeService;
use Illuminate\Http\Request;

class QRCodeController extends BaseApiController
{
    public function __construct(protected QRCodeService $service)
    {
    }
    public function generate(Request $request){
        $student = $request->attributes->get('current_student');
        return $this->service->generate($student);
    }


    public function studentIdCard(Request $request){
        $student = $request->attributes->get('current_student');
        return $this->service->view($student);
    }

    public function bulkGenerate(Request $request)
    {
        try {
            //code...
            $studentIds = $request->input('student_ids', []);
            $students = \App\Models\Student::whereIn('id', $studentIds)->get();
    
            if ($students->isEmpty()) {
                return response()->json(['message' => 'No students found.'], 404);
            }
    
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('qrcode_bulk_pdf', [
                'students' => $students,
            ]);
    
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="kartu-siswa.pdf"',
            ]);
        } catch (\Throwable $th) {
            //throw $th;
            dd($th);exit;
            throw $th;
        }
    }
}
