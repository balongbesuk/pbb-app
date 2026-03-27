# 📖 Wiki Sistem PBB Manager v6.0

Selamat datang di Wiki Teknis untuk proyek **PBB Manager**. Dokumen ini berfungsi sebagai pusat informasi mengenai arsitektur, keamanan, dan pemeliharaan sistem.

---

## 🏗️ Arsitektur & Teknologi

Sistem ini dibangun dengan stack modern yang dioptimalkan untuk performa dan keamanan pada lingkungan server dengan sumber daya terbatas (seperti VPS ARM64).

*   **Framework**: Next.js 16 (App Router) & React 19.
*   **Keamanan Core**: Next-Auth v4 dengan enkripsi `bcryptjs`.
*   **ORM / Database**: Prisma dengan SQLite (Default) untuk portabilitas data desa yang mudah dibawa/backup.
*   **Pemrosesan Dokumen**: `pdf-lib` dan `pdfjs-dist` v4.2+ untuk ekstraksi E-SPPT massal.
*   **Data Export**: SheetJS (XLSX) v0.20.3 untuk laporan Excel yang aman.

---

## 🔒 Hardening & Transparansi Keamanan (Update Maret 2026)

Kami terus melakukan audit keamanan untuk memastikan data warga tetap terlindungi. Berikut adalah langkah-langkah *hardening* terbaru:

### 1. Perbaikan Desain Keamanan
- **Audit Kredensial**: Menghapus seluruh kata sandi yang di-hardcode. Semua kredensial administratif kini dikelola melalui variabel lingkungan (`.env`).
- **Insecure Randomness**: Memperbaiki algoritma pembangkitan nilai acak pada token dan sesi untuk mencegah prediksi serangan.
- **Validasi Path**: Menambahkan sanitasi ketat pada API Restoration untuk mencegah serangan *Path Traversal*.

### 2. Manajemen Dependensi Kritis
Kami menggunakan fitur `overrides` pada `package.json` untuk memaksa penggunaan versi paket yang telah ditambal (patched) dari kerentanan publik:
- **`xlsx` (SheetJS)**: Diperbarui ke v0.20.3 melalui CDN resmi (menghindari kerentanan *Prototype Pollution* pada versi npm lama).
- **`tar`**: Dipaksa ke v7.5.13 untuk menghindari celah keamanan *brace-expansion*.
- **`effect`**: Diperbarui ke v3.21.0 untuk mencegah kebocoran konteks `AsyncLocalStorage`.

---

## 📂 Indeks Dokumentasi Lengkap

Gunakan panduan berikut untuk kebutuhan operasional Anda:

| Dokumen | Deskripsi |
| :--- | :--- |
| **[Panduan Instalasi](./PANDUAN_INSTALASI.md)** | Instruksi penyiapan server, Node.js, dan inisialisasi database. |
| **[Dokumentasi Penggunaan](./DOKUMENTASI_PENGGUNAAN.md)** | Panduan fitur dashboard, penagihan, dan manajemen user. |
| **[Panduan Arsip Digital](./PANDUAN_ARSIP_DIGITAL.md)** | Detail teknis mengenai *Smart Scan* dan *PDF Compression*. |
| **[README Utama](./README.md)** | Gambaran umum proyek dan fitur unggulan. |

---

## 🛠️ Alur Kerja Teknis (Workflows)

### Sinkronisasi Data (Excel)
Sistem menggunakan `exceljs` dan `xlsx` untuk membaca DHKP. Alur kerjanya memastikan data NOP (Nomor Objek Pajak) unik dan tersortir secara otomatis untuk memudahkan pencarian.

### Pemulihan Data (Restoration)
API `/api/restore` dirancang untuk melakukan tugas berat dengan sistem *Rollback* otomatis. Jika proses pemulihan gagal di tengah jalan, sistem akan berusaha mengembalikan database ke kondisi terakhir yang stabil.

---

## 📡 Kontak & Pemeliharaan
Pastikan untuk selalu menjalankan `npm audit` secara berkala dan melakukan `git pull` untuk mendapatkan pembaruan keamanan terbaru dari repositori pusat.

*Terakhir diperbarui: 27 Maret 2026*
