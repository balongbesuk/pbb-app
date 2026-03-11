<img width="2548" height="930" alt="image" src="https://github.com/user-attachments/assets/b449c06b-9c5c-4b36-9f72-2d7f23bf6c9a" />



# 🏦 PBB Manager — Sistem Manajemen Pajak Desa

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://prisma.io)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D20-green?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)

**PBB Manager** adalah aplikasi web modern untuk membantu Pemerintah Desa/Kelurahan dalam tata kelola pendataan, penagihan, dan pelaporan Pajak Bumi dan Bangunan (PBB) secara akurat, cepat, dan transparan.

---

## ✨ Fitur Unggulan

| Fitur | Deskripsi |
|---|---|
| **Dashboard Real-Time** | Pantau tren realisasi harian, statistik wilayah, dan performa petugas secara langsung |
| **Portal Warga Modern** | Pencarian tagihan publik dengan efek *glassmorphism*, pencarian cepat, dan desain premium |
| **Branding Dinamis** | Ubah logo desa, nama desa, kecamatan, dan kabupaten langsung dari menu Pengaturan |
| **Import Excel Pintar** | Unggah format DHKP (.xlsx) dengan proteksi anti-duplikat, pemetaan Dusun/RT/RW otomatis |
| **Delegasi Penarik** | Distribusikan tagihan Wajib Pajak ke petugas lapangan dengan *Bulk Assign* satu klik |
| **Audit Trail** | Rekam seluruh aktivitas: login, perubahan status, rotasi hak akses — tidak bisa dimanipulasi |
| **Desa-First UX** | Nama desa, kecamatan, dan kabupaten otomatis diformat Title Case agar tampilan rapi & profesional |
| **Backup & Restore** | Unduh backup database sewaktu-waktu; pulihkan jika terjadi kesalahan |

---

## 👥 Sistem Peran (*Role System*)

Tiga level akses untuk menjaga integritas data pajak:

### 👑 ADMIN — Kepala Desa / Petugas IT / Admin PBB
- Kontrol penuh terhadap seluruh sistem & pengaturan profil instansi
- Mengelola akun pengguna (buat, edit, reset password, hapus)
- Update Logo Desa, Nama Desa, Kec, dan Kab untuk branding portal & login
- Import Excel DHKP & atur distribusi wilayah ke penarik
- Memantau Log Aktivitas seluruh pengguna
- Backup, restore, dan reset database

### 📱 PENARIK — Kepala Dusun / Petugas Lapangan
- Antarmuka mobile-friendly, ringan di HP
- Mengubah status WP: **Belum Lunas** → **Lunas**
- Mengalihkan Wajib Pajak ke penarik lain (dengan persetujuan)
- Request Wajib Pajak dari penarik lain (dengan persetujuan)

### 🛡️ PENGGUNA — Staf / Akun Baru
- Peran default saat akun pertama kali dibuat
- Hak akses hanya-baca (*view only*)
- Dipromosikan oleh Admin sesuai kebutuhan

---

## 🛠️ Panduan Instalasi

### Persyaratan
- **Node.js** versi 20 LTS atau lebih baru  
- **Git** (opsional, untuk menarik pembaruan)

### 1. Download & Setup

```bash
# Clone repository
git clone https://github.com/balongbesuk/pbb-app.git
cd pbb-app

# Install dependensi
npm install
```

### 2. Konfigurasi Environment

Buat file `.env.local` di root proyek:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth — ganti secret dengan string acak yang panjang!
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="isi-dengan-string-random-minimal-32-karakter"

# Password default untuk akun baru (opsional, default: pbb12345)
DEFAULT_USER_PASSWORD="pbb12345"
```

> ⚠️ **Penting:** Jangan gunakan `NEXTAUTH_SECRET` yang sama antara development dan production!

### 3. Setup Database

```bash
# Buat struktur database
npx prisma db push

# (Windows) Jika ada error generate
npx prisma generate

# Buat akun Admin perdana
npx prisma db seed
```

**Akun default setelah seed:**
| Field | Nilai |
|---|---|
| Username | `admin` |
| Password | `admin123` |
| Peran | ADMIN |

> ⚠️ **Segera ganti password** setelah pertama kali login!

### 4. Menjalankan Aplikasi

**Mode Production:**
```bash
# Build bundle
npm run build

# Jalankan server
npm run start
```
Akses di: `http://localhost:3000`

---

## 📦 Script yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Cek semua isu ESLint (error + warning) |
| `npm run lint:errors` | Tampilkan error saja (untuk CI) |
| `npm run lint:fix` | Auto-fix ESLint |
| `npm run format` | Format semua file dengan Prettier |
| `npm run format:check` | Cek format tanpa mengubah file |
| `npm run audit:a11y` | Audit aksesibilitas WCAG 2.1 AA (butuh server aktif) |

---

## 🔒 Catatan Keamanan Production

- Ganti `NEXTAUTH_SECRET` dengan string random minimal 32 karakter
- Ganti `DEFAULT_USER_PASSWORD` dari nilai default
- Aktifkan HTTPS (cookie otomatis menggunakan `secure: true` di production)
- Sesi pengguna otomatis expire setelah **8 jam**
- Login dibatasi **10 percobaan per 15 menit** per alamat IP

---

## 🔄 Update Aplikasi

```bash
git pull origin main
npm install
npx prisma db push
npm run build
npm run start
```

---

*Dibuat oleh Tim Digitalisasi PBB Desa — 2026*
