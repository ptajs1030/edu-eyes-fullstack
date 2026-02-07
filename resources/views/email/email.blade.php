<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3490dc;
            color: white !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #2779bd;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        .content {
            background-color: #f9f9f9;
            padding: 25px;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <!-- Ganti dengan logo perusahaan Anda -->
        <img src="{{ asset('images/logo.png') }}" alt="Company Logo" class="logo">
        <h2>Reset Password Anda</h2>
    </div>
    
    <div class="content">
        <p>Halo,</p>
        
        <p>Kami menerima permintaan untuk mengatur ulang password akun Anda. Jika Anda tidak melakukan permintaan ini, Anda dapat mengabaikan email ini.</p>
        
        <p>Untuk mengatur ulang password Anda, silakan klik tombol di bawah ini:</p>
        
        <div style="text-align: center;">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </div>
        
        <p>Atau salin dan tempel link berikut ke browser Anda:</p>
        
        <p><a href="{{ $resetUrl }}" style="word-break: break-all;">{{ $resetUrl }}</a></p>
        
        <p>Link reset password akan kadaluarsa dalam menit.</p>
        
        <p>Jika Anda mengalami masalah, silakan hubungi tim dukungan kami.</p>
        
        <p>Terima kasih,<br>Tim {{ config('app.name') }}</p>
    </div>
    
    <div class="footer">
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        <p>Jika Anda tidak meminta reset password, tidak ada tindakan lebih lanjut yang diperlukan.</p>
    </div>
</body>
</html>