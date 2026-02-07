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
            $studentIds = $request->input('student_ids', []);
            $pdf = $this->service->generateBulk($studentIds);

            return $pdf->download('kartu-siswa-bulk.pdf');
        } catch (\Throwable $th) {
            \Log::error('Bulk kartu siswa error: '.$th->getMessage());
            return response()->json([
                'message' => 'Gagal generate kartu siswa',
                'error'   => $th->getMessage()
            ], 500);
        }
    }
}
