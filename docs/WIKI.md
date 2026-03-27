# 📖 Wiki Sistem PBB Manager v7.0

Selamat datang di Wiki Teknis untuk proyek **PBB Manager**. Dokumen ini berfungsi sebagai pusat informasi mengenai arsitektur, keamanan, dan pemeliharaan sistem.

---

## 🏗️ Arsitektur & Teknologi

Sistem ini dibangun dengan stack modern yang dioptimalkan untuk performa dan keamanan pada lingkungan server dengan sumber daya terbatas (seperti VPS ARM64).

*   **Framework**: Next.js 16 (App Router) & React 19.
*   **Keamanan Core**: Next-Auth v4 dengan enkripsi `bcryptjs`.
*   **Sanitasi Global**: Utilitas `sanitizeText` & `sanitizeNumberString` untuk keamanan input publik.
*   **ORM / Database**: Prisma dengan SQLite (Default) untuk portabilitas data desa yang mudah dibawa/backup.
*   **Pemrosesan Dokumen**: `pdf-lib` dan `pdfjs-dist` v4.2+ untuk ekstraksi E-SPPT massal.

---

## 🔒 Hardening & Transparansi Keamanan (Update Akhir Maret 2026)

Kami terus melakukan audit keamanan untuk memastikan data warga tetap terlindungi. Berikut adalah langkah-langkah *hardening* terbaru di v7.0:

### 1. Sanitasi Input & Anti-XSS (v7.0)
- **Global Stripping**: Seluruh input teks pada portal publik (seperti Nama Pengaju, Alamat, dan Nomor Surat) kini diproses melalui algoritma pembersihan karakter HTML/Script berbahaya.
- **Numeric Validation**: Validasi ketat pada NOP dan NIK menggunakan regex untuk memastikan hanya angka yang masuk ke sistem, mencegah injeksi SQL sederhana maupun kesalahan input.
- **Format Normalization**: Otomatisasi pengubahan huruf kecil ke besar (Capitalization) dan penghapusan spasi berlebih pada data sensitif seperti NOP.

### 2. Perbaikan Desain Keamanan Sebelumnya
- **Audit Kredensial**: Menghapus seluruh kata sandi yang di-hardcode. Semua kredensial administratif kini dikelola melalui variabel lingkungan (`.env`).
- **Validasi Path**: Menambahkan sanitasi ketat pada API Restoration untuk mencegah serangan *Path Traversal*.

---

## 📂 Indeks Dokumentasi Lengkap

Gunakan panduan berikut untuk kebutuhan operasional Anda:

| Dokumen | Deskripsi |
| :--- | :--- |
| **[Panduan Instalasi](./PANDUAN_INSTALASI.md)** | Instruksi penyiapan server, Node.js, dan inisialisasi database. |
| **[Dokumentasi Penggunaan](./DOKUMENTASI_PENGGUNAAN.md)** | Panduan fitur dashboard, penagihan, dan manajemen user. |
| **[Panduan Arsip Digital](./PANDUAN_ARSIP_DIGITAL.md)** | Detail teknis mengenai *Smart Scan* dan *PDF Compression*. |
| **[README Utama](../README.md)** | Gambaran umum proyek dan fitur unggulan. |

---

## 🛠️ Alur Kerja Teknis (Workflows)

### Modul Mutasi SPPT (v7.0)
Sistem mutasi menggunakan alur 3-langkah (Steper):
1. **Identifikasi Data Lama**: Penarikan data *real-time* dari database utama berdasarkan NOP.
2. **Input Data Baru**: Form input terenkripsi dengan validasi NIK yang ketat.
3. **Smart Preview & Scaling**: Menggunakan rasio `215mm` (ukuran kertas F4/Fullfolio) dengan logika *scaling* otomatis untuk tampilan layar ponsel kecil tanpa merusak tata letak dokumen resmi.

### Pemulihan Data (Restoration)
API `/api/restore` dirancang untuk melakukan tugas berat dengan sistem *Rollback* otomatis. Jika proses pemulihan gagal, sistem akan berusaha mengembalikan database ke kondisi terakhir yang stabil.

---

## 📡 Kontak & Pemeliharaan
Pastikan untuk selalu menjalankan `npm audit` secara berkala dan melakukan `git pull` untuk mendapatkan pembaruan keamanan terbaru.

*Terakhir diperbarui: 28 Maret 2026*
