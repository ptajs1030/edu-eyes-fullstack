<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kartu Siswa</title>
</head>
<body style="background-color:#f3f4f6; font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;">

<div style="max-width:24rem; margin-left:auto; margin-right:auto; background-color:#fff; border:1px solid #d1d5db; border-radius:0.5rem; box-shadow:0 1px 3px rgba(0,0,0,0.1); overflow:hidden;">
    <div style="background-color:#3b82f6; color:#fff; text-align:center; padding:1rem;">
        <h1 style="font-size:1.25rem; font-weight:700; vertical-align:middle;">{{ $schoolName }}</h1>
        <p>{{ $schoolAddress }}</p>
        <hr>
        <p style="font-weight:700; margin-left:1rem; margin-right:1rem; text-align:center; margin-top:1rem;">KARTU PRESENSI</p>
    </div> 
    
    <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="display:flex; flex-direction:row;">
            <div style="background-color:#3b82f6; display:grid; place-items:center; width:10rem; height:5rem; border-bottom-right-radius:9999px;">
                <img src="{{ $logoUrl }}" alt="Logo Sekolah" style="width:4rem; height:4rem; margin-left:0.5rem; margin-right:0.5rem;" />
            </div>
            <img src="{{ $photoUrl }}" alt="Foto Siswa" style="border-radius:9999px; object-fit:cover; width:8rem; height:8rem; margin-top:2.5rem;" />
            <div style="background-color:#3b82f6; display:grid; place-items:center; width:10rem; height:5rem; border-bottom-left-radius:9999px;">
                <img src="{{ $logoUrl }}" alt="Logo Sekolah" style="width:4rem; height:4rem; margin-left:0.5rem; margin-right:0.5rem;" />
            </div>
        </div>

        <p style="font-weight:700; margin-left:1rem; margin-right:1rem; margin-top:1rem; font-size:20px;">{{ $studentName }}</p>
    </div>
    <div style="padding:1rem; display:flex; flex-direction:column;">
        <p style="color:#4b5563; font-size:16px;">NIS / NISN : {{ $nis }}</p>
        <p style="color:#4b5563; font-size:16px;">KELAS : {{ $class }} </p>
        <p style="color:#4b5563; font-size:16px;">ALAMAT : {{ $address }}</p>
        <div style="display:flex; flex-direction:column; align-items:center;">
            <img src="{{ $qrcode_image }}" alt="QR Code" style="margin-top:1rem; width:10rem; height:10rem;" />
        </div>
    </div>
</div>

</body>
</html>
