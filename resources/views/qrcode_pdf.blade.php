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
    
   <div class="qrcode">
        <!-- Gunakan direktif @php untuk embed SVG -->
        @php
            echo $qrcode;
        @endphp
    </div>
    <div class="name">{{ $name }}</div>
</body>
</html>
