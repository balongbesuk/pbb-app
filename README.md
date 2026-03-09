# 🏦 PBB Manager - Sistem Manajemen Pajak Desa

Selamat datang di **PBB Manager**, sebuah aplikasi web modern berbasis **Next.js 16** untuk membantu Pemerintah Desa/Kelurahan dalam mengelola pendataan, penagihan, dan pelaporan Pajak Bumi dan Bangunan (PBB) secara efisien dan transparan.

---

## 🚀 Fitur Utama

-   **Dashboard Real-time:** Pantau persentase realisasi, sisa tagihan, dan tren bulanan dalam grafik interaktif.
-   **Import DHKP Excel:** Unggah data pajak ribuan baris dalam hitungan detik.
-   **Otomasi Wilayah:** Deteksi otomatis RT/RW dan Dusun dari alamat warga.
-   **Manajemen Penarik:** Alokasikan daftar penagihan ke petugas lapangan secara presisi.
-   **Log Aktivitas (Audit Trail):** Rekam jejak siapa yang mengubah data, menandai lunas, atau menghapus data.
-   **Laporan Excel:** Ekspor rekapitulasi lunas/belum lunas per RW dengan satu klik.
-   **Mobile Friendly:** Tampilan responsif yang nyaman dibuka di Tablet atau Smartphone oleh petugas lapangan.

---

## 🛠️ Panduan Penginstalan

### 1. Prasyarat
-   **Node.js** (Versi 18+)
-   **NPM** (Bawaan Node.js)

### 2. Langkah Setup
1.  **Clone Project:**
    Download atau Clone folder ini ke komputer Anda.
2.  **Install Dependencies:**
    Buka terminal di folder project, jalankan:
    ```bash
    npm install
    ```
3.  **Konfigurasi Environment:**
    Buat file bernama `.env` di folder root dan isi dengan:
    ```env
    DATABASE_URL="file:./dev.db"
    NEXTAUTH_SECRET="pbb-manager-secret-key-123"
    NEXTAUTH_URL="http://localhost:3000"
    ```
4.  **Inisialisasi Database:**
    Simpan skema database ke file lokal:
    ```bash
    npx prisma db push
    ```
5.  **Jalankan:**
    ```bash
    npm run dev
    ```
    Buka peramban di alamat [http://localhost:3000](http://localhost:3000).

---

## 📖 Cara Penggunaan Singkat

### Untuk Admin:
1.  **Profil:** Isi data Desa di menu **Pengaturan**.
2.  **Data:** Unggah file Excel DHKP di menu **Upload Data PBB**.
3.  **Tugas:** Buka menu **Laporan**, pilih wilayah, dan gunakan tombol **Atur Penarik Masal** untuk membagi tugas ke petugas.
4.  **Audit:** Cek menu **Log Aktivitas** secara berkala untuk memantau integritas data.

### Untuk Petugas (Penarik):
1.  **Login** dengan akun penarik yang sudah dibuat admin.
2.  Buka menu **Data Pajak**, cari nama warga yang membayar.
3.  Klik status **Belum Lunas** (Merah) untuk mengubahnya menjadi **Lunas** (Hijau).

---

## 🛡️ Lisensi & Kontribusi
Aplikasi ini dikembangkan untuk mempermudah birokrasi tingkat desa. 

**Dibuat oleh Antigravity AI Assistant - 2026**
