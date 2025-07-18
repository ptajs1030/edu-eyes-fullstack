<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { text-align: center; font-family: sans-serif; }
        .name { margin-top: 20px; font-size: 20px; font-weight: bold; }
    </style>
</head>
<body>
    
    <img src="{{ $qrcode_image }}" alt="QR Code">
    <div class="name">{{ $name }}</div>
</body>
</html>
