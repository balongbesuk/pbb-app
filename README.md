# 🏦 PBB Manager - Sistem Manajemen Pajak Desa

**PBB Manager** adalah aplikasi web modern masa kini untuk membantu Pemerintah Desa/Kelurahan dalam mengelola pendataan, penagihan, dan pelaporan Pajak Bumi dan Bangunan (PBB) secara akurat, cepat, dan transparan.

---

## 🔥 Fitur Unggulan

-   **Dashboard Visual:** Pantau persentase penagihan harian dan grafik tren bulanan secara *real-time*.
-   **Import Cepat:** Unggah ribuan data DHKP dari Excel dalam hitungan detik.
-   **Alokasi Otomatis:** Deteksi RT/RW dan Dusun dari alamat warga secara sistematis.
-   **Tugas Penarik:** Bagi daftar tagihan ke setiap petugas lapangan dengan satu klik.
-   **Audit Trail Lanjut:** 
    *   **Pencatatan Aktivitas:** Rekam setiap aksi petugas (Lunas, Batal Lunas, Pindah Wilayah).
    *   **Pencarian & Paginasi:** Cari aksi berdasarkan nama Wajib Pajak atau petugas dengan cepat.
    *   **Log Login:** Pantau waktu masuk setiap petugas untuk keamanan sistem.
-   **Notifikasi Pintar:**
    *   **Penyaluran Pajak:** Terima atau tolak permintaan penyerahan data antar petugas langsung dari lonceng notifikasi.
    *   **Mark All Read:** Bersihkan riwayat pemberitahuan dengan satu tombol.
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
2.  **Buka Command Prompt (CMD):** Klik Start (Pojok kiri bawah), ketik `CMD`, lalu klik kanan dan pilih **"Run as Administrator"** jika perlu.
3.  **Masuk ke Folder:** Ketik perintah ini dan tekan Enter:
    ```cmd
    cd /d D:\PBB-APP
    ```
4.  **Install Sistem:** Ketik perintah di bawah ini dan tunggu sampai selesai (perlu koneksi internet):
    ```cmd
    npm install
    ```
5.  **Setup Konfigurasi (.env):** 
    Agar sistem bisa berjalan, kita perlu membuat file konfigurasi. Ikuti langkah ini pelan-pelan:
    *   **Duplikat File:** Di CMD, ketik perintah ini lalu Enter:
        ```cmd
        copy .env.example .env
        ```
    *   **Edit dengan Notepad:** Masih di CMD, ketik perintah ini untuk membuka file tersebut:
        ```cmd
        notepad .env
        ```
    *   **Simpan:** Di jendela Notepad yang muncul, cari tulisan `NEXTAUTH_SECRET`, Anda boleh ganti kodenya atau biarkan saja. Kemudian klik menu **File > Save**, lalu tutup Notepadnya.

### 3. Menyiapkan Database & Menjalankan Aplikasi
Setelah setup selesai, sekarang kita siapkan tempat penyimpanan data:
1.  **Siapkan Database:** Di CMD, ketik dua perintah ini satu persatu (Enter di setiap baris):
    ```cmd
    npx prisma db push
    npx prisma db seed
    ```
2.  **Nyalakan Aplikasi (Mode Produksi):**
    Agar aplikasi berjalan cepat dan stabil, ketik perintah ini:
    ```cmd
    npm run build
    npm run start
    ```
3.  **Akses Aplikasi:** Buka **Google Chrome** dan ketik alamat: `http://localhost:3000`
    -   **Username Default:** `admin`
    -   **Password Default:** `admin123`
    -   *Kiat: Tekan tombol `CTRL + C` di CMD untuk mematikan sistem.*

---

## 🔒 Keamanan & Pemeliharaan
-   **Verifikasi Zod:** Seluruh input data divalidasi dengan ketat untuk mencegah kesalahan entri.
-   **Audit Log:** Seluruh perubahan data penting terekam dengan jejak audit yang tidak bisa dihapus.
-   **Database:** Seluruh data tersimpan secara aman di folder `prisma/dev.db`. Jangan hapus file tersebut.
-   **Backup Keseluruhan:** Cadangan database berbentuk file `.zip`. Fitur ini difungsikan untuk menghindari kehilangan data jika suatu saat komputer desa rusak, terkena virus (seperti ransomware), atau perlu dipindahkan pelayanannya ke komputer yang baru (migrasi).
    *   **Cara Pakai (Restore):** 
        1. Ekstrak (Unzip) file backup yang telah diunduh (`pbb_backup_....zip`).
        2. Di dalamnya terdapat file bernama `dev.db`.
        3. Matikan aplikasi jika sedang berjalan (tekan `CTRL + C` di CMD).
        4. Simpan file `dev.db` tersebut di dalam folder `prisma/` pada direktori instalasi aplikasi Anda, lalu timpa *(replace)* file lama yang ada di sana.
        5. Nyalakan lagi aplikasinya. Seluruh data tagihan, pengguna, dan log seketika akan kembali seperti pada tanggal backup tersebut dilakukan.

---
**Dibuat oleh Antigravity AI Assistant untuk Desa Terdigitalisasi - 2026**
