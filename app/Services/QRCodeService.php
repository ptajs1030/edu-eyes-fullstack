<?php

namespace App\Services;

use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeService
{
    public function generate()
    {
        $students = Student::all();
        $generated = [];
        $skipped = [];

        foreach ($students as $student) {
            $filename = 'qrcode_' . $student->full_name . '.pdf';
            $path = 'qrcodes/' . $filename;

            if (Storage::disk('public')->exists($path)) {
                $skipped[] = asset('storage/'.$path);
                continue;
            }

            $qrcode = QrCode::size(300)->generate($student->id)->format('svg');
            $pdf = Pdf::loadView('qrcode_pdf', [
                'qrcode' => $qrcode,
                'name'   => $student->full_name,
            ]);

            Storage::disk('public')->put($path, $pdf->output());
            $generated[] = asset('storage/'.$path);
        }

        return response()->json([
            'message'   => 'QR codes process completed',
            'generated' => $generated,
            'skipped'   => $skipped,
        ]);
    }
}