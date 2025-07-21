<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kartu Siswa</title>
    <style>
        body {
            font-family: sans-serif;
        }

        .page {
            text-align: center;
            padding: 60px;
        }

        .qrcode {
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    @foreach ($students as $student)
        @php
            $qrPng = base64_encode(QrCode::format('png')->size(200)->generate($student->uuid));
        @endphp

        <div class="page" style="{{ !$loop->last ? 'page-break-after: always;' : '' }}">
            <div class="qrcode">
                <img src="data:image/png;base64,{{ $qrPng }}" width="200" />
            </div>
            <h3>{{ $student->full_name }}</h3>
        </div>
    @endforeach
</body>
</html>