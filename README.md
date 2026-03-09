<img width="2537" height="941" alt="image" src="https://github.com/user-attachments/assets/de9d301d-7095-49ca-b683-6cdc57a4ea22" />


# 🏦 PBB Manager - Sistem Manajemen Pajak Desa

**PBB Manager** adalah aplikasi web modern masa kini untuk membantu Pemerintah Desa/Kelurahan dalam mengelola pendataan, penagihan, dan pelaporan Pajak Bumi dan Bangunan (PBB) secara akurat, cepat, dan transparan.

---

## 🔥 Fitur Unggulan

-   **Dashboard Visual:** Pantau persentase penagihan harian dan grafik tren bulanan.
-   **Import Cepat:** Unggah ribuan data DHKP dari Excel dalam hitungan detik.
-   **Alokasi Otomatis:** Deteksi RT/RW dan Dusun dari alamat warga secara sitematis.
-   **Tugas Penarik:** Bagi daftar tagihan ke setiap petugas lapangan dengan satu klik.
-   **Audit Aktivitas:** Catat siapa yang melakukan transaksi lunas untuk mencegah selisih uang.
-   **Laporan Excel:** Cetak rekapitulasi lunas/belum lunas per RW yang siap dilaporkan ke Kecamatan.
-   **Responsif:** Sangat nyaman dibuka melalui HP atau Tablet oleh petugas saat menagih ke rumah warga.

---

## 🛠️ Panduan Instalasi (Untuk Pemula)

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di komputer kantor atau server desa Anda.

### 1. Persiapan Awal
Pastikan komputer Anda sudah terinstall:
-   **Node.js (Versi Terbaru):** Download di [nodejs.org](https://nodejs.org/) (Pilih versi LTS). Klik Next terus sampai finish.
-   **Web Browser:** Gunakan Google Chrome atau Microsoft Edge terbaru.

### 2. Cara Download & Setup
1.  **Download Project:** Klik tombol hijau bertuliskan **"Code"** di atas, lalu pilih **"Download ZIP"**. Ekstrak hasilnya ke folder pilihan Anda (Misal di `D:\PBB-APP`).
2.  **Buka Command Prompt (CMD):** Klik Start, ketik `CMD`, tekan Enter.
3.  **Masuk ke Folder:** Ketik perintah ini (Sesuaikan dengan folder Anda):
    ```cmd
    cd /d D:\PBB-APP
    ```
4.  **Install Sistem:** Ketik perintah di bawah ini dan tunggu sampai selesai (perlu koneksi internet):
    ```cmd
    npm install
    ```
5.  **Buka File Konfigurasi:** Cari file bernama `.env.example`, ubah namanya menjadi `.env`. Isi bagian `NEXTAUTH_SECRET` dengan kode rahasia bebas.

### 3. Menjalankan Mode Produksi (Siap Pakai)
Untuk penggunaan sehari-hari di kantor, jalankan perintah berikut:
1.  **Siapkan Database:**
    ```cmd
    npx prisma db push
    npx prisma db seed
    ```
2.  **Kompilasi Aplikasi (Hanya Sekali):**
    ```cmd
    npm run build
    ```
3.  **Jalankan Aplikasi:**
    ```cmd
    npm run start
    ```
4.  **Akses:** Buka Google Chrome dan ketik alamat: `http://localhost:3000`
    -   **Username Default:** `admin`
    -   **Password Default:** `admin123`

---

## 🔒 Keamanan & Pemeliharaan
-   **Database:** Seluruh data tersimpan secara aman di folder `prisma/dev.db`. Jangan hapus file tersebut.
-   **Backup:** Disarankan melakukan copy-paste folder seluruh aplikasi ke Flashdisk setiap minggu sebagai cadangan data.

---
**Dibuat oleh Antigravity AI Assistant untuk Desa Terdigitalisasi - 2026**
