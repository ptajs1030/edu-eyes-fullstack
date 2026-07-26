# Edu Eyes Admin - UI/UX Spec

> Dokumen spesifikasi UI/UX untuk keperluan redesign. Data dan fungsi tetap, hanya tampilan yang diubah.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 (PHP), MySQL |
| Frontend | React + Inertia.js + TypeScript |
| Styling | Tailwind CSS + Radix UI + Headless UI |
| Motion | Framer Motion |
| Icons | Lucide React |

---

## Navigation (Sidebar)

```
Beranda                          /
Data Siswa                      /students
  └─ Tambah Siswa               /students/create
Data Guru                       /admin/teachers
Data Orang Tua                  /admin/parents
Data Admin                      /admin/admins
Kelas                           /classrooms
  └─ Tambah Kelas               /classrooms/create
Tahun Ajaran                    /academic-years
  └─ Tambah Tahun Ajaran        /academic-years/create
Mata Pelajaran                  /subjects
  └─ Tambah Mata Pelajaran      /subjects/create
Shifting / Jam Pelajaran        /shiftings
  └─ Tambah Shifting            /shiftings/create
Hari Libur Custom               /custom-day-offs
  └─ Tambah Hari Libur          /custom-day-offs/create
Pembayaran                      /payments
  └─ Tambah Pembayaran          /payments/create
Pengumuman                      /announcements
  └─ Tambah Pengumuman          /announcements/create
Event                           /events
  └─ Tambah Event               /events/create
Tugas                           /tasks
  └─ Tambah Tugas               /tasks/create
Ujian                           /exams
  └─ Buat Ujian Baru            /exams/create
Kenaikan Kelas                  /grade-promotions
─────────────────────────────
Roles                           /roles
School Settings                 /school-settings
Pengaturan                      /settings/profile
```

---

## 1. Dashboard (`/`)

### Data yang Ditampilkan
- **SchoolStatsCard** (via API `GET /api/school-stats`)
  - Total Siswa (dengan animasi counter)
  - Total Guru
  - Total Kelas
  - Total Orang Tua
  - Total Admin
  - Loading skeleton saat data belum loaded

### Aksi
- **QuickActions** (6 kartu shortcut navigasi):
  - Tambah Siswa -> `/students/create`
  - Tambah Guru -> `/admin/teachers/create`
  - Buat Pengumuman -> `/announcements/create`
  - Kelola Kelas -> `/classrooms`
  - Kelola Pembayaran -> `/payments`
  - Kelola Event -> `/events`

### Modal/Dialog
- Tidak ada

---

## 2. Data Siswa (`/students`)

### 2.1 List Siswa (`/students`)

#### Data yang Ditampilkan
- **Summary Cards**: Total Siswa, Aktif, Tidak Aktif
- **Tabel Siswa** (kolom):
  - Nama
  - NIS
  - NISN
  - Kelas (nama kelas)
  - Status (Aktif / Tidak Aktif)
  - Jenis Kelamin (Laki-laki / Perempuan)
  - Aksi
- **Filter**: Tahun Ajaran, Kelas, Status, Search (nama/email)
- **Pagination**

#### Aksi
- Tambah Siswa -> `/students/create`
- Edit Siswa -> `/students/{id}/edit`
- Hapus Siswa (via ActionModal konfirmasi)
- Search & filter
- Sort kolom

#### Modal/Dialog
- `ActionModal` - konfirmasi hapus

---

### 2.2 Form Siswa (Create/Edit)

#### Field Form
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| name | text | Ya | Nama lengkap |
| nis | text | Ya | Nomor Induk Siswa |
| nisn | text | Ya | NISN |
| birth_place | text | Ya | Tempat lahir |
| birth_date | date | Ya | Tanggal lahir |
| gender | radio | Ya | Laki-laki / Perempuan |
| address | textarea | Ya | Alamat |
| phone | text | Tidak | No. HP |
| status | select | Ya | Aktif / Tidak Aktif |
| classroom_id | select | Ya | Pilih kelas |
| academic_year_id | select | Ya | Pilih tahun ajaran |
| parent_id | select | Tidak | Pilih orang tua |
| photo | file upload | Tidak | Foto siswa |

#### Aksi
- Simpan (create: `router.post('/students')`, edit: `router.put('/students/{id}')`)
- Batal -> kembali ke list

---

### 2.3 Riwayat Kehadiran Siswa (`/students/{id}/attendance-history`)

#### Data yang Ditampilkan
- Info siswa: Nama, Kelas
- **Toggle Tab**: Shifting / Subject
- **Filter**: Tahun Ajaran
- **Summary Stats**: Total kehadiran, Hadir, Izin/Sakit, Alpha
- **Shifting Mode**: Timeline view (clock in/out per shift)
- **Subject Mode**: Tabel (Tanggal, Mata Pelajaran, Status, Clock In, Clock Out, Catatan)

#### Aksi
- Filter tahun ajaran
- Toggle antara Shifting / Subject view

---

## 3. Data Guru (`/admin/teachers`)

### 3.1 List Guru

#### Data yang Ditampilkan
- **Tabel Guru** (kolom):
  - Nama Lengkap
  - Email
  - Avatar (atau initials fallback)
  - Tanggal Dibuat
  - Aksi
- **Search** (nama/email)
- **Pagination**

#### Aksi
- Tambah Guru -> `/admin/teachers/create`
- Edit Guru -> `/admin/teachers/{id}/edit`
- Hapus Guru (via ActionModal)
- Import Excel (admin only) - kolom: `nama_lengkap`, `email`, `password`
- Export CSV

#### Modal/Dialog
- `ActionModal` - konfirmasi hapus
- `ImportModal` - upload Excel (admin only)

---

### 3.2 Form Guru (Create/Edit)

#### Field Form
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| full_name | text | Ya | Nama lengkap |
| email | text | Ya | Email |
| password | password | Ya (create) | Password |
| password_confirmation | password | Ya (create) | Konfirmasi password |
| phone | text | Tidak | No. HP |
| avatar | file upload | Tidak | Foto profil |

#### Aksi
- Simpan / Update
- Batal

---

## 4. Data Orang Tua (`/admin/parents`)

### 4.1 List Orang Tua

#### Data yang Ditampilkan
- Sama struktur dengan Data Guru
- **Tabel** (kolom): Nama Lengkap, Email, Avatar, Tanggal Dibuat, Aksi
- Search + Pagination

#### Aksi
- Tambah / Edit / Hapus Orang Tua
- Import Excel (admin only)
- Export CSV

---

### 4.2 Form Orang Tua (Create/Edit)
- Sama dengan form Guru

---

## 5. Data Admin (`/admin/admins`)

### 5.1 List Admin

#### Data yang Ditampilkan
- Sama struktur dengan Data Guru/Orang Tua
- **Tabel** (kolom): Nama Lengkap, Email, Avatar, Tanggal Dibuat, Aksi
- **Filter Tambahan**: Filter by Role (dropdown)
- Search + Pagination

#### Aksi
- Tambah / Edit / Hapus Admin
- Import Excel (admin only)
- Export CSV

---

## 6. Kelas (`/classrooms`)

### 6.1 List Kelas

#### Data yang Ditampilkan
- **Summary Card**: Total Kelas
- **Tabel Kelas** (kolom):
  - Nama Kelas
  - Tingkat
  - Tahun Ajaran
  - Aksi
- **Filter**: Tahun Ajaran, Search (nama)
- **Pagination**

#### Aksi
- Tambah Kelas -> `/classrooms/create`
- Edit Kelas -> `/classrooms/{id}/edit`
- Lihat Detail -> `/classrooms/{id}`
- Lihat Jadwal -> `/classrooms/{id}/schedule`
- Lihat Riwayat -> `/classrooms/{id}/history`
- Hapus Kelas (via ActionModal)
- Import Excel - kolom: `nama_kelas`, `tingkat`, `tahun_ajaran`
- Export CSV

#### Modal/Dialog
- `ActionModal` - konfirmasi hapus
- `ImportModal` - upload Excel

---

### 6.2 Form Kelas (Create/Edit)

#### Field Form
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| name | text | Ya | Nama kelas |
| level | text | Ya | Tingkat |
| academic_year_id | select | Ya | Tahun ajaran |
| subject_ids | multi-select | Tidak | Mata pelajaran |

#### Aksi
- Simpan / Update
- Batal

---

### 6.3 Detail Kelas (`/classrooms/{id}`)

#### Data yang Ditampilkan
- Info Kelas: Nama, Tingkat, Tahun Ajaran
- **Tabel Mata Pelajaran** (kolom): Nama, Tahun Kurikulum
- **Tabel Daftar Siswa** (kolom): Nama, NIS, NISN, Jenis Kelamin, Foto

#### Aksi
- Edit Kelas
- Hapus Siswa dari Kelas (inline delete)

---

### 6.4 Jadwal Kelas (`/classrooms/{id}/schedule`)

#### Data yang Ditampilkan
- Mode **Shifting**: Tab hari (Senin-Minggu), per shift menampilkan tabel jadwal
- Mode **Subject**: Tab hari, tabel jadwal (waktu, mata pelajaran)
- **Tabel Jadwal**: Waktu Mulai, Waktu Selesai, Mata Pelajaran, Shift (jika shifting)

#### Aksi
- Tambah Jadwal (via Modal: hari, jam mulai, jam selesai, shift/mata pelajaran)
- Edit Jadwal (via Modal)
- Hapus Jadwal (inline)

#### Modal/Dialog
- Add/Edit Schedule Modal (dengan animasi Framer Motion)

---

### 6.5 Riwayat Kelas (`/classrooms/{id}/history`)

#### Data yang Ditampilkan
- **Filter**: Tahun Ajaran
- **Tabel Siswa per Tahun**: Nama, NIS, NISN, Jenis Kelamin, Foto
- Empty state jika tidak ada data

#### Aksi
- Filter tahun ajaran

---

## 7. Tahun Ajaran (`/academic-years`)

### 7.1 List Tahun Ajaran

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Tahun Ajaran (format: YYYY/YYYY)
  - Tahun Mulai
  - Tahun Selesai
  - Status (Aktif / Tidak Aktif - badge)
  - Dibuat
  - Diubah
  - Aksi
- Search + Pagination

#### Aksi
- Tambah -> `/academic-years/create`
- Edit -> `/academic-years/{id}/edit`
- Hapus (via ActionModal)

---

### 7.2 Form Tahun Ajaran (Create/Edit)

#### Field Form
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| title | text | Ya | Format YYYY/YYYY (auto-generate) |
| start_year | number | Ya | Tahun mulai |
| end_year | number | Ya | Tahun selesai |
| status | select | Ya | Aktif / Tidak Aktif |

---

## 8. Mata Pelajaran (`/subjects`)

### 8.1 List Mata Pelajaran

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Nama
  - Tahun Kurikulum
  - Dibuat
  - Diubah
  - Aksi
- Search + Pagination

#### Aksi
- Tambah -> `/subjects/create`
- Edit -> `/subjects/{id}/edit`
- Hapus (via ActionModal)

---

### 8.2 Form Mata Pelajaran (Create/Edit)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| name | text | Ya |
| curriculum_year | text | Ya |

---

## 9. Shifting / Jam Pelajaran (`/shiftings`)

### 9.1 List Shifting

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Nama Shifting
  - Jam Mulai
  - Jam Selesai
  - Dibuat
  - Diubah
  - Aksi
- Pagination

#### Aksi
- Tambah -> `/shiftings/create`
- Edit -> `/shiftings/{id}/edit`
- Hapus (via ActionModal)

---

### 9.2 Form Shifting (Create/Edit)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| shift_name | text | Ya |
| start_time | time (HH:mm) | Ya |
| end_time | time (HH:mm) | Ya |

---

## 10. Hari Libur Custom (`/custom-day-offs`)

### 10.1 List Hari Libur

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Judul
  - Tanggal (format Indonesia)
  - Deskripsi
  - Dibuat
  - Diubah
  - Aksi
- Pagination

#### Aksi
- Tambah -> `/custom-day-offs/create`
- Edit -> `/custom-day-offs/{id}/edit`
- Hapus (via ActionModal)

---

### 10.2 Form Hari Libur (Create/Edit)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| title | text | Ya |
| date | date | Ya |
| description | textarea | Tidak |

---

## 11. Pembayaran (`/payments`)

### 11.1 List Pembayaran

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Nama Pembayaran
  - Nominal (format Rupiah)
  - Status (Lunas / Belum Lunas - badge)
  - Tenggat (due date)
  - Tahun Ajaran
  - Dibuat
  - Diubah
  - Aksi
- Search + Pagination

#### Aksi
- Tambah -> `/payments/create`
- Edit -> `/payments/{id}/edit`
- Lihat Detail -> `/payments/{id}`
- Hapus (via ActionModal)
- Kirim Notifikasi (via Firebase push)

#### Modal/Dialog
- `ActionModal` - konfirmasi hapus

---

### 11.2 Form Pembayaran (Create/Edit)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| name | text | Ya |
| description | textarea | Tidak |
| nominal | number | Ya |
| status | select | Ya (Lunas / Belum Lunas) |
| due_date | date | Ya |
| academic_year_id | select | Tidak |

---

### 11.3 Detail Pembayaran (`/payments/{id}`)

#### Data yang Ditampilkan
- **Info Pembayaran**: Nama, Deskripsi, Nominal, Status, Tenggat, Tahun Ajaran
- **Summary Stats**: Total Siswa, Sudah Dibayar, Belum Dibayar, Jumlah Terkumpul
- **Tabel Siswa** (kolom):
  - Nama Siswa
  - Kelas
  - Status (Lunas / Belum)
  - Tanggal Bayar
  - Jumlah Dibayar
  - Aksi
- **Dropdown Tambah Siswa** (SearchableSelect - siswa aktif)

#### Aksi
- Tambah Siswa ke Pembayaran (via dropdown)
- Tandai Sudah Dibayar (via ConfirmationModal)
- Hapus Siswa dari Pembayaran
- Edit Pembayaran

#### Modal/Dialog
- `ConfirmationModal` - konfirmasi tandai sudah dibayar

---

## 12. Pengumuman (`/announcements`)

### 12.1 List Pengumuman

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Judul
  - Target (Semua / Siswa / Guru / Orang Tua)
  - Status (Published / Draft / Archived - badge)
  - Diterbitkan
  - Dibuat
  - Diubah
  - Aksi
- Search + Pagination

#### Aksi
- Tambah -> `/announcements/create`
- Edit -> `/announcements/{id}/edit`
- Lihat Detail -> `/announcements/{id}`
- Hapus (via ActionModal)
- Kirim Notifikasi (via Firebase push)

---

### 12.2 Form Pengumuman (Create/Edit)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| title | text | Ya |
| content | rich text (react-quill) | Ya |
| target_audience | select | Ya (Semua / Siswa / Guru / Orang Tua) |
| status | select | Ya (draft / published / archived) |
| published_at | datetime | Tidak |
| attachments | dynamic URL fields | Tidak (edit mode - preview) |

---

### 12.3 Detail Pengumuman (`/announcements/{id}`)

#### Data yang Ditampilkan
- Judul
- Konten (HTML rendered)
- Target Audience
- Status
- Tanggal Terbit
- Lampiran (jika ada)

#### Aksi
- Edit
- Kembali ke list

---

## 13. Event (`/events`)

### 13.1 List Event

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Judul
  - Lokasi
  - Tanggal Mulai
  - Tanggal Selesai
  - Status (Active / Completed / Cancelled / Draft - badge)
  - Dibuat
  - Diubah
  - Aksi
- Search + Pagination

#### Aksi
- Tambah -> `/events/create`
- Edit -> `/events/{id}/edit`
- Lihat Kehadiran -> `/events/{id}/attendance`
- Hapus (via ActionModal)
- Kirim Notifikasi (via Firebase push)

---

### 13.2 Form Event (Create/Edit)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| title | text | Ya |
| description | textarea | Tidak |
| location | text | Tidak |
| start_date | date | Ya |
| end_date | date | Ya |
| status | select | Ya (draft / active / completed / cancelled) |

---

### 13.3 Kehadiran Event (`/events/{id}/attendance`)

#### Data yang Ditampilkan
- **Info Event**: Judul, Lokasi, Tanggal
- **Filter**: Tanggal (from/to)
- **Summary Stats**: Total Siswa, Hadir, Tidak Hadir
- **Tabel Kehadiran** (kolom):
  - Nama Siswa
  - Kelas
  - Status (Hadir / Tidak Hadir / Izin / Sakit)
  - Tanggal
  - Jam Masuk
  - Jam Keluar
  - Catatan
  - Aksi

#### Aksi
- Filter tanggal
- Edit Kehadiran (via modal overlay penuh)

---

### 13.4 Edit Kehadiran Event (`/events/{id}/attendance/edit`)

#### Data yang Ditampilkan
- Overlay modal penuh (Framer Motion)
- Daftar siswa dengan dropdown status yang bisa diedit

#### Aksi
- Simpan Semua Perubahan (bulk update)
- Batal

---

## 14. Tugas (`/tasks`)

### 14.1 List Tugas

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Judul
  - Mata Pelajaran
  - Tahun Ajaran
  - Tenggat (due date + time)
  - Dibuat
  - Diubah
  - Aksi
- Status badge (draft / active / completed)
- Search + Pagination

#### Aksi
- Tambah -> `/tasks/create`
- Edit -> `/tasks/{id}/edit`
- Lihat Detail/Nilai -> `/tasks/{id}`
- Hapus (via ActionModal)
- Kirim Notifikasi (via Firebase push)

---

### 14.2 Form Tugas (Create/Edit)

#### Field Form
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| subject_id | select | Ya | Mata pelajaran |
| title | text | Ya | Maks 70 karakter |
| description | rich text | Ya | react-quill |
| due_date | date | Ya | Tenggat |
| due_time | time | Ya | Jam tenggat |
| attachments | dynamic URL fields | Tidak | Daftar link lampiran |
| student_assignments | via modal | Tidak | Pilih siswa |
| academic_year | read-only | - | Tahun ajaran aktif (otomatis) |

#### Modal/Dialog
- `StudentAssignmentModal` - pilih siswa per kelas

---

### 14.3 Detail/Penilaian Tugas (`/tasks/{id}`)

#### Data yang Ditampilkan
- **Info Tugas**: Judul, Tahun Ajaran, Mata Pelajaran, Tenggat
- **Tabel Penilaian** (kolom):
  - Nama Siswa
  - NIS
  - Kelas
  - Nilai (inline editable, 0-100)
  - Status (Belum Dinilai / Sudah Dinilai)
- **Color Coding Nilai**: >=80 hijau, >=60 kuning, <60 merah
- Info panel (biru)

#### Aksi
- Edit nilai inline per siswa
- Simpan Semua Nilai (bulk save - muncul saat ada perubahan)
- Export Nilai (client-side CSV download)

---

## 15. Ujian (`/exams`)

### 15.1 List Ujian

#### Data yang Ditampilkan
- **Filter**: Tahun Ajaran
- **Tabel** (kolom):
  - Judul
  - Mata Pelajaran
  - Tahun Ajaran
  - Jumlah Siswa
  - Rata-rata Nilai
  - Dibuat
  - Diubah
  - Aksi

#### Aksi
- Buat Ujian Baru -> `/exams/create`
- Lihat Penilaian -> `/exams/{id}/scoring`
- Hapus (via ActionModal)

---

### 15.2 Form Ujian (Create)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| subject_id | select | Ya |
| title | text | Ya (maks 70 karakter) |
| student_assignments | via modal | Tidak |
| academic_year | read-only | - (tahun ajaran aktif) |

#### Modal/Dialog
- `StudentAssignmentModal` - pilih siswa per kelas

---

### 15.3 Penilaian Ujian (`/exams/{id}/scoring`)
- Sama pola dengan Detail/Penilaian Tugas
- Inline editing, bulk save, CSV export

---

## 16. Kenaikan Kelas (`/grade-promotions`)

### 16.1 Overview

#### Data yang Ditampilkan
- **Filter**: Tahun Ajaran
- **Flow Diagram** (ReactFlow / @xyflow/react):
  - Node = kelas
  - Edge = arah kenaikan kelas (dari -> ke)
  - Label edge = jumlah siswa + status
  - Label node = nama kelas + jumlah siswa
- **Summary Cards**: Total Kelas, Total Siswa Dipromosikan, Kelas Aktif
- Tabel fallback untuk tahun non-aktif

#### Aksi
- Kelola Penugasan -> `/grade-promotions/{id}/assign`
- Hapus (via ActionModal)

---

### 16.2 Penugasan Kenaikan Kelas (`/grade-promotions/{id}/assign`)

#### Data yang Ditampilkan
- **Info**: Kelas Asal -> Kelas Tujuan
- **Tabel Siswa** (kolom):
  - Nama Siswa
  - NIS
  - NISN
  - Jenis Kelamin
  - Kelas Asal
  - Status (Dipromosikan / Tidak Dipromosikan - badge)
- **Summary**: Total Siswa, Dipromosikan, Belum Dipromosikan
- **SearchableSelect** untuk tambah siswa

#### Aksi
- Tambah Siswa (via SearchableSelect)
- Hapus Siswa dari Promosi (inline)

---

## 17. Roles (`/roles`)

### 17.1 List Roles

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Nama Role
  - Permissions (badge list, format: `read_users` -> "Read Users")
  - Aksi

#### Aksi
- Tambah Role (via FormModal)
- Edit Role (via FormModal, pre-filled)
- Hapus Role (via ActionModal)

#### Modal/Dialog
- `FormModal` - form create/edit role
- `ActionModal` - konfirmasi hapus

---

### 17.2 Form Role (Modal-based)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| name | text | Ya |
| permissions | checkbox multi-select | Ya |

---

## 18. School Settings (`/school-settings`)

### 18.1 List Settings

#### Data yang Ditampilkan
- **Tabel** (kolom):
  - Key (e.g., `school_name`)
  - Nilai (boolean: toggle icon, password: masked dots)
  - Tipe (string / boolean / password)
  - Deskripsi
  - Aksi
- Tombol "Generate" untuk cronjob tertentu

#### Aksi
- Tambah Setting (via FormModal)
- Edit Setting (via FormModal, pre-filled)
- Hapus Setting (via ActionModal)
- Generate Cronjob (via `router.post`)

---

### 18.2 Form Setting (Modal-based)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| key | text | Ya |
| value | text / toggle / password (by type) | Ya |
| type | select (string / boolean / password) | Ya |
| description | text | Tidak |

---

## 19. Pengaturan Akun (`/settings`)

### 19.1 Profile (`/settings/profile`)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| full_name | text | Ya |
| email | text | Ya |
| avatar | file upload | Tidak |

#### Aksi
- Simpan Profile (`router.post('/settings/profile')`)

---

### 19.2 Password (`/settings/password`)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| current_password | password | Ya |
| password | password | Ya |
| password_confirmation | password | Ya |

#### Aksi
- Update Password (`router.post('/settings/password')`)

---

### 19.3 Info Sekolah (`/settings/school`)

#### Field Form
| Field | Tipe | Wajib |
|---|---|---|
| name | text | Ya | Nama Sekolah |
| address | textarea | Ya | Alamat Sekolah |
| logo | file upload | Tidak | Logo Sekolah |

#### Aksi
- Simpan (`fetch` ke `/api/school-settings/{key}`)

---

## 20. Auth Pages

### 20.1 Login (`/login`)

#### Field Form
| Field | Tipe |
|---|---|
| email | email |
| password | password |
| remember | checkbox |

#### Aksi
- Login (`router.post('/login')`)
- Lupa Password -> `/forgot-password`

---

### 20.2 Lupa Password (`/forgot-password`)

#### Field Form
| Field | Tipe |
|---|---|
| email | email |

#### Aksi
- Kirim link reset

---

### 20.3 Reset Password (`/reset-password`)

#### Field Form
| Field | Tipe |
|---|---|
| email | email |
| password | password |
| password_confirmation | password |

---

## Komponen Shared

| Komponen | Fungsi |
|---|---|
| `Table` | Tabel generik, sortable, select all |
| `Pagination` | Navigasi halaman |
| `FormModal` | Dialog form reusable (roles, settings) |
| `ActionModal` | Konfirmasi hapus/destruktif |
| `ImportModal` | Upload Excel, mapping kolom, preview |
| `SearchableSelect` | Dropdown dengan pencarian |
| `MultiSearchableSelect` | Multi-select dengan pencarian |
| `RichTextEditor` | WYSIWYG (react-quill) |
| `ConfirmationModal` | Konfirmasi generik |
| `StudentAssignmentModal` | Pilih siswa per kelas |
| `SchoolStatsCard` | Widget statistik dashboard |
| `QuickActions` | Shortcut aksi dashboard |

---

## Notification System

- Firebase Cloud Messaging (FCM) untuk push notification ke mobile
- Tombol kirim notifikasi ada di: Pengumuman, Event, Tugas, Pembayaran
- Endpoint: `router.post('/{entity}/{id}/notify')`

---

## Import/Export

- **Import**: Excel (.xlsx/.xls) via `ImportModal`, mapping kolom, preview sebelum submit
- **Export**: Client-side CSV download (tanpa server endpoint)
- **PDF**: Generate di backend (DomPDF/mPDF/Browsershot)
