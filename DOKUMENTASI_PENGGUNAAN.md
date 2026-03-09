# 📖 Panduan Penggunaan Aplikasi PBB Manager

Dokumen ini adalah panduan langkah-demi-langkah bagi Admin Desa dan Petugas Penarik untuk mengoperasikan aplikasi Pajak Bumi dan Bangunan (PBB) dengan benar.

---

## 🚀 Bab 1: Persiapan Akun (Admin)

### 1. Masuk ke Sistem (Login)
-   Buka alamat aplikasi (misal: `http://localhost:3000`).
-   Masukkan **Username**: `admin` dan **Password**: `admin123` (Akun bawaan default).
-   Disarankan segera mengubah password di menu **Pengaturan > Akun** demi keamanan data warga.

### 2. Melengkapi Profil Pemerintahan
-   Klik menu **Pengaturan** di sebelah kiri.
-   Pilih **Profil Instansi**.
-   Isi Nama Desa, Kecamatan, dan Kabupaten/Kota.
-   **Mengapa penting?** Karena data ini akan muncul otomatis di kepala (kop) laporan Excel yang akan Anda serahkan ke atasan.

---

## 📂 Bab 2: Manajemen Data Pajak (Admin)

### 1. Pendaftaran Nama-Nama Dusun
Ini adalah langkah paling penting sebelum upload data.
-   Masuk ke **Pengaturan > Referensi Dusun**.
-   Tambahkan semua nama dusun di desa Anda satu per satu.
-   Tanpa daftar ini, aplikasi tidak bisa memisahkan warga per dusun secara otomatis.

### 2. Mengunggah Data DHKP (Excel)
Ini dilakukan setiap setahun sekali atau saat ada pembaruan data.
-   Pilih menu **Upload Data PBB**.
-   Pilih Tahun Pajak (misal: 2026).
-   Pilih file Excel DHKP Anda.
-   Klik **Mulai Import**. Tunggu sampai muncul notifikasi "Berhasil".
-   Aplikasi secara pintar akan membagi warga ke dalam RT dan RW berdasarkan alamat di Excel.

---

## 👮 Bab 3: Pembagian Tugas Petugas (Mapping)

Jangan lelah membagi tugas satu per satu. Gunakan fitur **Masal** (Cepat):
1.  Klik menu **Laporan**.
2.  Pilih Tab **Wilayah** (Misal: RW 01).
3.  Klik tombol biru **"Atur Penarik Masal"**.
4.  Pilih nama Kepala Dusun atau Petugas lapangan.
5.  **Hasil:** Semua warga di RW tersebut akan muncul di HP/Tablet petugas tersebut saat mereka login.

---

## 💳 Bab 4: Pelaporan Pembayaran (Petugas Lapangan)

### 1. Mencari Nama Warga
Petugas cukup membawa HP saat menagih ke rumah warga:
-   Klik menu **Data Pajak**.
-   Ketik nama warga atau nomor NOP di kotak pencarian.
-   Gunakan filter RT atau RW agar daftar lebih pendek.

### 2. Menandai Lunas
-   Jika warga membayar, klik label berwarna Merah bertuliskan **"Belum Lunas"**.
-   Status akan berubah menjadi Hijau **"Lunas"**.
-   Data ini langsung masuk ke laporan Admin secara *real-time*.

---

## 🔍 Bab 5: Monitoring & Keamanan (Admin)

### 1. Pantau Lewat Dashboard
-   Buka halaman **Dashboard** untuk melihat uang yang sudah terkumpul.
-   Lihat grafik **Top Kolektor** untuk tahu siapa petugas yang paling rajin menagih.

### 2. Log Aktivitas (Audit)
-   Gunakan menu **Log Aktivitas** untuk memantau transaksi.
-   Jika ada warga protes sudah bayar tapi di sistem belum, Anda bisa cek di sini siapa petugas yang terakhir kali mengubah data tersebut.

---

## 💾 Bab 6: Penutupan & Backup data

-   **Ekspor Laporan:** Setiap bulan, buka menu **Laporan**, lalu pilih **Excel Laporan Lunas** untuk disimpan sebagai arsip fisik kantor.
-   **Backup Sistem:** Copy folder aplikasi ini ke Flashdisk secara rutin agar jika komputer rusak, data pajak desa tidak hilang.

---
*Panduan ini dibuat eksklusif untuk kemajuan Desa Anda - 2026*
