# 📘 Panduan Lengkap Penggunaan PBB Manager

Dokumen ini berisi instruksi detail cara mengoperasikan aplikasi PBB Manager setelah berhasil diinstal.

---

## 🛠️ Langkah Awal (Setup Admin)

### 1. Konfigurasi Profil Desa
Sangat penting untuk mengisi data profil di menu **Pengaturan > Profil Instansi**.
-   **Nama Desa, Kecamatan, dan Kabupaten** akan digunakan otomatis sebagai Kop Surat pada setiap laporan Excel yang diunduh.
-   Data ini membuat laporan Anda terlihat resmi dan profesional.

### 2. Pendaftaran Referensi Dusun
Masuk ke **Pengaturan > Referensi Dusun**. Masukkan semua nama dusun yang ada.
-   **Fungsi:** Sistem akan mencocokkan alamat pada file Excel yang diupload dengan daftar ini secara otomatis.

---

## 📅 Manajemen Data Tahunan

### 1. Upload Data (DHKP)
-   Buka menu **Upload Data PBB**.
-   Gunakan template yang tersedia jika data Anda berantakan.
-   Sistem memiliki fitur **Anti Ganda**, jadi jika Anda upload file yang sama dua kali, data tidak akan menduplikasi (hanya menambah yang baru).

### 2. Pembersihan Data
Jika ingin memulai tahun baru (misal pindah dari 2025 ke 2026), gunakan tombol **Reset Data** di halaman Upload untuk membersihkan database tahun tersebut tanpa menghapus akun login petugas.

---

## 👮 Pembagian Tugas (Mapping)

Admin tidak perlu mengatur penarik satu per satu untuk ribuan data.
-   Buka menu **Laporan**.
-   Pilih salah satu RW (Misal: RW 01).
-   Klik **Atur Penarik Masal**.
-   Pilih nama petugas yang bertanggung jawab di RW tersebut.
-   **Hasil:** Seluruh warga di RW tersebut otomatis menjadi tugas petugas tersebut di aplikasi mereka.

---

## 📱 Panduan Untuk Petugas Penarik

### 1. Pencarian Cepat
Gunakan kolom pencarian di menu **Data Pajak**. Anda bisa mencari dengan mengetik:
-   Sebagian nama warga (Contoh: "Purnomo").
-   Nomor NOP.

### 2. Penandaan Pembayaran
Cukup satu klik pada label status di tabel. 
-   **Belum Lunas (Merah)** -> **Lunas (Hijau)**.
-   Status Lunas akan mencatat waktu pembayaran dan siapa yang melakukan klik tersebut di sistem **Log Aktivitas**.

---

## 📊 Pelaporan & Audit

### 1. Monitoring Dashboard
Bagan grafik akan bergeser secara real-time setiap kali ada petugas yang menandai lunas di lapangan. Admin bisa memantau siapa penarik yang kinerjanya paling lambat atau wilayah mana yang paling sulit ditagih.

### 2. Audit Trail (Log)
Jika terjadi selisih uang, Admin bisa memeriksa menu **Log Aktivitas**.
-   "X mengubah NOP 35... menjadi Lunas pada jam 14.00".
-   Ini mencegah adanya petugas yang menandai lunas namun uangnya tidak disetorkan.

---

## 💾 Backup & Pemulihan
Gunakan fitur **Restore Alokasi** di menu Pengaturan jika Anda baru saja mengupload data tahun baru dan ingin menerapkan pembagian petugas (Mapping) yang sama seperti tahun lalu secara otomatis.

---
*Dibuat oleh Antigravity AI Assistant - 2026*
