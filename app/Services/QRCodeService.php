<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\Student;
use Mpdf\Mpdf;
use PDF;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Spatie\Browsershot\Browsershot;
use Str;

class QRCodeService
{
    public function generate($student){
        $schoolName = Setting::where('key', 'school_name')->value('value');
        $schoolLogo = Setting::where('key', 'school_logo')->value('value');
        $schoolAddress = Setting::where('key', 'school_address')->value('value');
    
        $student = Student::with('classroom')->find($student->id);
        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $pdfFileName = 'qrcode_' . Str::slug($student->full_name) . '.pdf';
        $pdfPath = storage_path('app/public/qrcodes/' . $pdfFileName);

        if (Storage::disk('public')->exists('qrcodes/' . $pdfFileName)) {
            return response()->download($pdfPath, $pdfFileName);
        }

        Storage::disk('public')->makeDirectory('qrcodes');

        $logoUrl = !empty($schoolLogo) && file_exists(storage_path('app/public/' . $schoolLogo))
            ? 'data:image/png;base64,' . base64_encode(file_get_contents(storage_path('app/public/' . $schoolLogo))): getProfilePictureUrlAttribute();

        if (!empty($student->profile_picture) && file_exists(storage_path('app/public/' . $student->profile_picture))) {
            $photoUrl = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(storage_path('app/public/' . $student->profile_picture)));
        } else {
            $photoUrl = $student->getProfilePictureUrlAttribute();
        }

        $eduEyeslogo = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('edu-eyes.png')));

        $svg = QrCode::size(200)->generate($student->uuid);
        $svgDataUri = 'data:image/svg+xml;base64,' . base64_encode($svg);

        $html = view('kartu-siswa', [
            'qrcode_image' => $svgDataUri,
            'studentName' => $student->full_name,
            'schoolName' => $schoolName,
            'schoolAddress' => $schoolAddress,
            'logoUrl' => $logoUrl,
            'eduEyeslogo' => $eduEyeslogo,
            'photoUrl' => $photoUrl,
            'nis' => $student->nis,
            'class' => $student->classroom->name ?? '',
            'address' => $student->address
        ])->render();

        if (file_exists($pdfPath)) {
            unlink($pdfPath);
        }
        $mpdf = new Mpdf([
            'format' => [212, 336],
            'margin_top'    => 0,
            'margin_right'  => 0,
            'margin_bottom' => 0,
            'margin_left'   => 0,
        ]);
        $mpdf->WriteHTML($html);
        $mpdf->Output($pdfPath, \Mpdf\Output\Destination::FILE);

        return response()->download($pdfPath, $pdfFileName);
    }
    
    public function view($student){
        $student = Student::with('classroom')->find(12);
        $schoolName = Setting::where('key', 'school_name')->value('value');
        $schoolLogo = Setting::where('key', 'school_logo')->value('value');
        $schoolAddress = Setting::where('key', 'school_address')->value('value');
        
        $student = Student::with('classroom')->find($student->id);
        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }


        $logoUrl = null;
        if (!empty($schoolLogo)) {
            $schoolLogoPath = storage_path('app/public/' . $schoolLogo);
            if (file_exists($schoolLogoPath)) {
                $logoUrl = 'data:image/png;base64,' . base64_encode(file_get_contents($schoolLogoPath));
            }
        }


        $photoUrl = null;
        if (!empty($student->profile_picture)) {
            $profilePath = storage_path('app/public/' . $student->profile_picture);
            if (file_exists($profilePath)) {
                $photoUrl = 'data:image/jpeg;base64,' . base64_encode(file_get_contents($profilePath));
            }
        }

        $eduEyeslogo='data:image/png;base64,' . base64_encode(file_get_contents(storage_path('app/public/uploads/logos/edu-eyes.png')));
        
        $svg = QrCode::size(200)->generate($student->uuid);
        $svgDataUri = 'data:image/svg+xml;base64,' . base64_encode($svg);
        $data=[
            'qrcode_image' => $svgDataUri,
            'studentName' => $student->full_name,
            'schoolName' => $schoolName,
            'schoolAddress' => $schoolAddress,
            'logoUrl' => $logoUrl,
            'eduEyeslogo' => $eduEyeslogo,
            'photoUrl' => $photoUrl,
            'nis' => $student->nis,
            'class' => $student->classroom->name ?? '',
            'address' => $student->address
        ];
        return view('kartu-siswa', compact($data));
    }
}