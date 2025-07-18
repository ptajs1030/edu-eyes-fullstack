<?php

namespace App\Services;

use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Str;

class QRCodeService
{
    public function generate($student)
    {
        $student = Student::find($student->id);
        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }
        $pdfFileName = 'qrcode_' . Str::slug($student->full_name) . '.pdf';
        $pdfPath = 'qrcodes/' . $pdfFileName;


        if (Storage::disk('public')->exists($pdfPath)) {
            return response()->download(storage_path('app/public/' . $pdfPath), $pdfFileName);
        }
        $svg = QrCode::size(200)->generate($student->uuid);

       
        $svgBase64 = base64_encode($svg);
        $svgDataUri = 'data:image/svg+xml;base64,' . $svgBase64;
        $pdf = Pdf::loadView('qrcode_pdf', [
            'qrcode_image' => $svgDataUri,
            'name' => $student->full_name,
        ]);

        
        
        Storage::disk('public')->put('qrcodes/' . $pdfFileName, $pdf->output());

        
        return response()->download(storage_path('app/public/' . $pdfPath), $pdfFileName);
    }
}