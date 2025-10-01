<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Kartu Siswa</title>
    <style>
       @page {
    margin: 0; /* biar benar-benar full page */
}

body {
    font-family: Arial, Helvetica, sans-serif;
    margin: 0;
    padding: 0;
}

.page {
    width: 100%;
    height: 100vh; /* penuh satu halaman PDF */
    display: flex;
    align-items: center;
    justify-content: center;
    page-break-after: always;
}

.card {
    width: 53.98mm;
    height: 85.6mm;
    background-color: #fff;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
    margin: auto; /* tambahan supaya benar-benar center */
}
        .header {
            background-color: #2b7fff;
            color: #fff;
            text-align: center;
            padding: 4px;
        }
        .header h1 {
            font-size: 12px;
            font-weight: 700;
            margin: 2px 0;
        }
        .header p {
            font-size: 9px;
            margin: 0;
        }
        .logo-table {
            margin-top: -5mm;
            width: 100%;
            border-collapse: collapse;
        }
        .logo-table td {
            text-align: center;
            vertical-align: middle;
        }
        .photo-container {
            display: table;
            width: 100%;
            margin-top: -10mm;
            height: 25mm;
        }
        .photo-center {
            display: table-cell;
            text-align: center;
            vertical-align: middle;
        }
        .photo-center img {
            border-radius: 100%;
            object-fit: cover;
            width: 15mm;
            height: 15mm;
            margin-top: 3mm;
        }
        .student-name {
            text-align: center;
            font-weight: 700;
            margin-top: -5mm;
            font-size: 12px;
        }
        .details {
            padding: 2mm;
            margin-left: 2mm;
            font-size: 9px;
        }
        .details p {
            color: #4b5563;
            margin: 0;
        }
        .qrcode {
            text-align: center;
            margin-top: 2mm;
        }
        .qrcode svg {
            width: 18mm;
            height: 18mm;
        }
    </style>
</head>
<body>
    @foreach($cards as $card)
    <div class="page">
        <div class="card">
            <!-- header -->
            <div class="header">
                <h1>{{ $card['schoolName'] }}</h1>
                <p>{{ $card['schoolAddress'] }}</p>
                <hr style="border:0; border-top:1px solid #fff; margin:2px 0;">
                <p style="font-weight:700; font-size:10px; margin:2px 0;">KARTU<br>PRESENSI</p>
            </div>

            <!-- logo kiri & kanan -->
            <table class="logo-table">
                <tr>
                    <td style="background-color:#2b7fff; width:15mm; height:5mm; border-bottom-right-radius:100%;">
                        @if($card['logoUrl'])
                            <img src="{{ $card['logoUrl'] }}" alt="Logo Sekolah" style="width:6mm; height:6mm; margin-top:4mm; margin-bottom:6mm; margin-right:4mm;">
                        @endif
                    </td>
                    <td></td>
                    <td style="background-color:#2b7fff; width:15mm; height:10mm; border-bottom-left-radius:100%;">
                        @if($card['eduEyeslogo'])
                            <img src="{{ $card['eduEyeslogo'] }}" alt="Logo Edu-Eyes" style="width:6mm; height:6mm; margin-top:4mm; margin-bottom:6mm; margin-left:4mm;">
                        @endif
                    </td>
                </tr>
            </table>

            <!-- foto -->
            <div class="photo-container">
                <div class="photo-center">
                    @if($card['photoUrl'])
                        <img src="{{ $card['photoUrl'] }}" alt="Foto Siswa">
                    @else
                        <img src="https://api.dicebear.com/9.x/initials/svg?seed={{ urlencode($card['studentName']) }}" alt="Avatar">
                    @endif
                </div>
            </div>

            <!-- nama -->
            <div class="student-name">
                {{ $card['studentName'] }}
            </div>
            <!-- detail siswa -->
            <div class="details">
                <p>NIS / NISN : {{ $card['nis'] }}</p>
                <p>KELAS : {{ $card['class'] }}</p>
                <p>ALAMAT : {{ $card['address'] }}</p>
            </div>
            <div style="text-align:center; margin-top:2mm;">
                <img src="{{ $card['qrcode_image'] }}" alt="QR Code" style="width:18mm; height:18mm;" />
            </div>
        </div>
    </div>
    @endforeach
</body>
</html>
