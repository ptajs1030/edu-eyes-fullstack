# 🎓 Edu Eyes

**Edu Eyes** adalah platform manajemen pendidikan berbasis Laravel 12 yang menggunakan arsitektur modern dan teknologi stack:

- Laravel 12
- Inertia.js + React
- Tailwind CSS
- MySQL
- Clean Architecture (DTO, Service, Resource, Custom Exception)

---

## 🚀 Tech Stack

- PHP 8.2+
- Laravel 12
- Inertia.js + React
- Tailwind CSS
- MySQL
- Laravel Sanctum (autentikasi API)
- Custom Artisan Command (make:dto, make:service)

---

## ⚙️ Instalasi

```bash
# 1. Clone repository
git clone https://github.com/yourname/edu-eyes.git
cd edu-eyes

# 2. Install dependencies
composer install
npm install

# 3. Copy env dan generate key
cp .env.example .env
php artisan key:generate

# 4. Setup database
php artisan migrate --seed

# 5. Compile frontend (React)
npm run build

# 6. Jalankan aplikasi
php artisan serve




# Custom command (sudah disiapkan):
php artisan make:dto User
php artisan make:service User
```


## 📁 Struktur Folder
```
app/
├── Console/
│   └── Commands/        → Custom Artisan commands
├── DTOs/                → Data Transfer Objects (DTO)
├── Exceptions/          → Custom exceptions
├── Http/
│   ├── Controllers/     → Web & API Controllers
│   ├── Requests/        → Validasi request & konversi ke DTO
│   └── Resources/       → API Resource (JSON response)
├── Services/            → Business logic layer (service classes)

routes/
├── api.php              → Route untuk API
├── web.php              → Route untuk Inertia + ReactJS
├── console.php          → Daftar custom Artisan commands

resources/js/
└── Pages/               → Halaman ReactJS (InertiaJS Pages)
```
