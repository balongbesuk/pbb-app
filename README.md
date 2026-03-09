# 🏦 PBB Manager - Sistem Manajemen Pajak Desa

Selamat datang di **PBB Manager**, sebuah aplikasi web modern berbasis **Next.js 16** untuk membantu Pemerintah Desa/Kelurahan dalam mengelola pendataan, penagihan, dan pelaporan Pajak Bumi dan Bangunan (PBB) secara efisien dan transparan.

---

## 🌟 Fitur Utama (Versi Produksi)

-   **Dashboard Real-time:** Pantau persentase realisasi, sisa tagihan, dan tren bulanan.
-   **Import DHKP Excel:** Unggah data ribuan warga dalam hitungan detik.
-   **Alokasi Petugas:** Bagi tugas penagihan per RW secara mudah kepada petugas lapangan.
-   **Log Aktivitas (Audit Trail):** Rekam jejak setiap perubahan status pembayaran untuk keamanan.
-   **Mobile Friendly:** Tampilan responsif untuk Tablet/HP petugas di lapangan.

---

## 🚀 Panduan Instalasi (Khusus Pemula)

Ikuti langkah demi langkah di bawah ini untuk menjalankan aplikasi di laptop/komputer Anda:

### 1. Persiapan Awal
Pastikan Anda sudah menginstal **Node.js** di komputer. Jika belum, download di [nodejs.org](https://nodejs.org).

### 2. Persiapan Project
1.  Buka folder proyek ini di komputer Anda.
2.  Buka **Terminal** atau **Command Prompt (CMD)** di dalam folder tersebut.
3.  Ketik perintah berikut untuk mengunduh semua library pendukung:
    ```bash
    npm install
    ```

### 3. Pengaturan Database (Sangat Penting)
Secara bawaan, database tidak diunggah ke GitHub demi keamanan data. Untuk membuat database baru yang bersih, jalankan perintah ini:
```bash
npx prisma db push
```
*Perintah ini akan membuat file `dev.db` di folder prisma secara otomatis.*

### 4. Menjalankan Mode Produksi (Cepat & Stabil)
Jangan gunakan perintah `dev` jika aplikasi ingin digunakan secara serius. Jalankan perintah produksi ini:
```bash
npm run build
npm run start
```
Akses aplikasi melalui peramban (Chrome/Edge) di alamat: [http://localhost:3000](http://localhost:3000)

---

## 💡 Tutorial Penggunaan Singkat

1.  **Login Pertama:** Masuk menggunakan akun admin.
2.  **Lengkapi Profil:** Isi Nama Desa & Tahun Pajak di menu **Pengaturan**.
3.  **Upload Data:** Masukkan file Excel DHKP di menu **Upload Data PBB**.
4.  **Ubah Status:** Cari nama warga di **Data Pajak**, lalu klik tombol statusnya untuk menandai pembayaran.

---

## 🛡️ Catatan Keamanan
Jangan membagikan file `.env` kepada orang asing karena berisi kunci rahasia aplikasi Anda.

*Dibuat oleh Antigravity AI Assistant - 2026*
