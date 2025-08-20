<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kartu Siswa</title>
</head>
<style>
  .container {
    display: table;
    width: 100%;
    margin-top: -10mm;
    height: 100vh; /* Full viewport height */
  }
  .centered-div {
    display: table-cell;
    text-align: center;
    vertical-align: middle;
  }
</style>
<body style=" font-family:Arial, Helvetica, sans-serif;">

<!-- kartu ukuran KTP -->
<div style="width:53.98mm; height:85.6mm; background-color:#fff; border:1px solid #d1d5db; border-radius:0.5rem; box-shadow:0 1px 3px rgba(0,0,0,0.1); overflow:hidden; margin:auto;">

    <!-- header -->
    <div style="background-color:#2b7fff; color:#fff; text-align:center; padding:4px;">
        <h1 style="font-size:12px; font-weight:700; margin:2px 0;">{{ $schoolName }}</h1>
        <p style="font-size:9px; margin:0;">{{ $schoolAddress }}</p>
        <hr style="border:0; border-top:1px solid #fff; margin:2px 0;">
        <p style="font-weight:700; font-size:10px; margin:2px 0;">KARTU<br>PRESENSI</p>
    </div> 
    
    <!-- logo kiri, foto, logo kanan -->
    <table cellspacing="0" cellpadding="0" style=" margin-top:-5mm;width:100%; border-collapse:collapse;">
        <tr>
            <td style="background-color:#2b7fff; width:15mm; height:5mm; border-bottom-right-radius:100%;  text-align:center; vertical-align:middle;">
                <img src="{{ $logoUrl }}" alt="Logo Sekolah" style="width:6mm; height:6mm; margin-top:4mm; margin-bottom:6mm; margin-right:4mm;" />
            </td>
            <td style="text-align:center; vertical-align:middle;">
                
            </td>
            <td style="background-color:#2b7fff; width:15mm;height:10mm; border-bottom-left-radius:100%; text-align:center; vertical-align:middle;">
                <img src="{{ $eduEyeslogo }}" alt="Logo edu-eyes" style="width:6mm; height:6mm; margin-top:4mm;margin-bottom:6mm; margin-left:4mm;" />
            </td>
        </tr>
    </table>
    <div class="container">
        <div class="centered-div">
            <img src="{{ $photoUrl }}" alt="Foto Siswa" style="border-radius:100%; object-fit:cover; width:15mm; height:15mm; margin-top:3mm; text-align:center;" />
        </div>
    </div>
    <!-- nama siswa -->
    <div style="text-align:center;">
        <p style="font-weight:700; margin-top:2mm; font-size:12px;">{{ $studentName }}</p>
    </div>

    <!-- detail siswa -->
    <div style="padding:2mm; font-size:9px;">
        <p style="color:#4b5563; margin:0;">NIS / NISN : {{ $nis }}</p>
        <p style="color:#4b5563; margin:0;">KELAS : {{ $class }}</p>
        <p style="color:#4b5563; margin:0;">ALAMAT : {{ $address }}</p>
        <div style="text-align:center; margin-top:2mm;">
            <img src="{{ $qrcode_image }}" alt="QR Code" style="width:18mm; height:18mm;" />
        </div>
    </div>
</div>

</body>
</html>
