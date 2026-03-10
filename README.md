# 🏦 PBB Manager - Sistem Manajemen Pajak Desa

**PBB Manager** adalah aplikasi web modern (*Progressive Web App*) untuk menunjang Pemerintah Desa/Kelurahan dalam tata kelola pendataan, penagihan, dan pelaporan Pajak Bumi dan Bangunan (PBB) secara akurat, cepat, dan transparan.

---

## 🔥 Fitur Unggulan

-   **Dashboard VIP:** Pantau tren realisasi harian, statistik wilayah, dan performa petugas secara *real-time* dengan balutan UI/UX setingkat Enterprise (Menggunakan font premium *Outfit*).
-   **Offline Mode (PWA):** Dapat di-*install* langsung ke layar utama HP (Home Screen) layaknya aplikasi *Native* dan dapat dibuka saat koneksi internet balai desa sedang tidak terhubung (memanfaatkan Workbox Caching).
-   **Sistem Import Pintar:** Unggah format DHKP Excel (.xlsx) dengan proteksi anti-ganda, sinkronisasi otomatis status Lunas untuk warga yang pindah/hilang, serta pemetaan (mapping) Dusun/RT/RW secara cerdas berdasarkan string alamat.
-   **Delegasi Penarik:** Distribusikan daftar tagihan WP ke para Kepala Dusun/Petugas Lapangan dengan sangat spesifik hanya dalam satu klik (Bulk Assign).
-   **Security Lapis Ganda:** Modul *Reset Database* dilengkapi fitur proteksi validasi kewaspadaan tipe GitHub (Ketik "RESET 2026") mencegah salah sentuh.
-   **Audit Trail Terpusat:** Rekam seluruh jejak perubahan warga, transaksi lunas, rotasi hak akses, hingga riwayat login petugas secara lengkap tanpa bisa dimanipulasi.
-   **Laporan Siap Cetak:** Ekspor rekapitulasi realisasi pajak per RW ke format Excel yang rapi untuk diserahkan ke jenjang Kecamatan.

---

## 👥 Hak Akses & Peran (*Role System*)

Sistem ini membagi batas wewenang ke dalam 3 level, demi menjaga integritas data pajak desa:

1.  **ADMIN (Kepala Desa / Pejabat IT / Admin PBB)**
    *   **Wewenang:** Tertinggi. Memiliki kendali penuh ke seluruh sistem aplikasi.
    *   **Tugas:** Mengelola import Excel DHKP, mengatur distribusi wilayah *(Mapping RW)* ke tiap Penarik, memantau *Log Aktivitas*, serta melakukan operasional esensial seperti Backup Database dan Reset Tahun Pajak.
2.  **PENARIK (Kepala Dusun / Ujung Tombak Lapangan)**
    *   **Wewenang:** Khusus operasional penagihan, dirancang sangat ringan di perangkat Mobile (HP).
    *   **Tugas:** Secara jemput-bola *(door-to-door)* mengubah status warga dari **Belum Lunas** ➔ **Lunas**. Dapat memantau dan mencari nama wajib pajak di dalam ruang lingkup teritorinya.
    *   **Batasan:** Tidak memiliki akses masuk ke laman Pengaturan Server, tidak dapat mengunggah (Upload) raw data pajak keseluruhan.
3.  **PENGGUNA (Akun Standar Baru / Staf)**
    *   **Wewenang:** Hak akses terendah yang diberikan otomatis saat pendaftaran akun baru pertama kali.
    *   **Batasan:** Belum memiliki izin (*Permission*) untuk mengubah transaksi pajak apapun hingga Sang ADMIN menaikkan pangkatnya menjadi PENARIK lapangan.

---

## 🛠️ Panduan Instalasi Server Desa (Untuk IT)

Aplikasi ini menggunakan ekosistem terbaru Next.js 16 (React 19), Tailwind CSS v4, Prisma (SQLite), dan Next-Auth. 

### 1. Persyaratan Server / Laptop
-   **Node.js:** Minimal versi 20 LTS.
-   **Git:** Opsional untuk menarik pembaruan kode.

### 2. Cara Download & Setup Awal
1.  Unduh direktori proyek (*Clone repository*) ke lokal Anda.
2.  Buka terminal/CMD, arahkan ke folder proyek, dan instal dependensi wajib:
    ```bash
    npm install
    ```
3.  Persiapkan Lingkungan (*Environment*):
    Salin profil `.env.example` menjadi file `.env`. (Isi kunci `NEXTAUTH_SECRET` dengan acak jika diperlukan agar sesi aman bertanda-tangan kriptografi).

### 3. Setup Database (SQLite Lokal)
Aplikasi ini tidak butuh XAMPP/MySQL. Database disimpan mulus secara lokal dalam folder `prisma/dev.db`.
1.  Bentuk struktur basis datanya:
    ```bash
    npx prisma db push
    ```
2.  Suntikkan akun Super Admin default perdana:
    ```bash
    npx prisma db seed
    ```

### 4. Menjalankan Mode Produksi (Wajib untuk PWA)
Agar aplikasi dapat berjalan super cepat, bebas galat *Linting*, dan fitur **Mode Offline (Instal ke HP)** menyala, Anda wajib melakukan proses kompilasi *(build)*:
```bash
npm run build --webpack
```
Setelah proses kompilasi *bundler* sukses tanpa warna merah, jalankan servernya untuk umum:
```bash
npm run start
```
Akses di browser kesayangan Anda pada `http://localhost:3000` atau `http://<IP_KANTOR_DESA>:3000`.
-   **Akun Default:** `admin` (Level: SUPER_ADMIN)
-   **Password Default:** `admin123`

---
*Dibuat oleh Tim Digitalisasi PBB Desa - 2026*
