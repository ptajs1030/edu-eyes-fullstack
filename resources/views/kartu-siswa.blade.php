<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    @vite('resources/css/app.css')
    <title>Kartu Siswa</title>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">

<div class="bg-white border border-gray-300 rounded-lg shadow-md overflow-hidden"
     style="width: 212px; height: 336px;">

    <!-- Header -->
    <div class="bg-blue-500 text-white text-center px-2">
        <h1 class="text-sm font-bold leading-tight">{{ $schoolName }}</h1>
        <p class="text-[10px] leading-tight">{{ $schoolAddress }}</p>
        <hr>
        <p class="font-bold text-[12px]">KARTU PRESENSI</p>
    </div>

    <!-- Foto & Logo -->
    <div class="flex justify-between items-center ">
        <div class="bg-blue-500 place-items-center items-center w-20 h-10 rounded-br-full -mt-3">
            <img src="{{ $logoUrl}}" alt="Logo Sekolah" class="w-8 h-8 mt-1" />
        </div>
        <img src="{{ $photoUrl}}" alt="Logo Sekolah" class="rounded-full object-cover w-12 h-12 mt-1" />
        <div class="bg-blue-500 place-items-center w-20 h-10 rounded-bl-full -mt-3">
            <img src="{{$eduEyeslogo}}" alt="Logo Sekolah" class="w-8 h-8 mt-1" />
        </div>
    </div>

    <!-- Nama -->
    <p class="text-center font-bold text-[18px] mt-4">{{ $studentName }}</p>

    <!-- Data Siswa -->
    <div class="px-2 mt-2 leading-tight">
        <p class="text-[12px]">NIS / NISN : {{ $nis }}</p>
        <p class="text-[12px]">KELAS : {{ $class }}</p>
        <p class="text-[12px] break-words">ALMAT : {{ $address }}</p>
    </div>

    <!-- QR Code -->
    <div class="flex justify-center mt-2">
        <img src="{{ $qrcode_image }}" alt="QR Code" class="w-24 h-24" />
    </div>

</div>

</body>
</html>
