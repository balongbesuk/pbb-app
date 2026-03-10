# 📖 Panduan Penggunaan PBB Manager

Selamat datang di **PBB Manager** — sistem digital untuk mempercepat pendataan dan penarikan Pajak Bumi dan Bangunan secara transparan dan terkoordinasi.

---

## 👥 Pengenalan Peran Pengguna

Setiap pengguna beroperasi sesuai peran yang ditetapkan oleh Admin.

| Peran | Lambang | Akses |
|---|---|---|
| **ADMIN** | 👑 | Penuh — kelola semua fitur sistem |
| **PENARIK** | 📱 | Lapangan — tagih WP di wilayah sendiri |
| **PENGGUNA** | 🛡️ | Hanya-baca — belum punya izin operasional |

---

## 👑 Panduan Admin

### 1. Login & Keamanan Akun

1. Buka aplikasi di browser, masukkan **username** dan **password**
2. Setelah login pertama kali, segera ganti password di **Pengaturan > Profil > Ganti Password**
3. Sesi akan otomatis berakhir setelah **8 jam** tidak aktif

> ⚠️ Sistem membatasi **10 percobaan login gagal** per 15 menit untuk mencegah akses tidak sah.

---

### 2. Memulai Tahun Pajak Baru

Setiap awal tahun, lakukan langkah berikut sebelum Excel DHKP dibagikan:

**A. Siapkan Referensi Dusun**
1. Buka menu **Pengaturan > Referensi Dusun**
2. Tambahkan nama semua dusun yang ada persis sesuai penulisan di file Excel
3. Daftar ini digunakan sistem untuk mendeteksi dan memetakan alamat secara otomatis

**B. Upload Data PBB**
1. Buka menu **Upload Data PBB**
2. Klik **Unduh Format Excel** jika butuh contoh format kolom yang benar
3. Pilih **Tahun Pajak** (contoh: 2026)
4. Pilih file Excel DHKP (.xlsx) lalu klik **Mulai Import**
5. Tunggu proses selesai — sistem akan menampilkan ringkasan hasil import

---

### 3. Membagi Wilayah & Mendelegasikan Penarik

**Bulk Assign (Satu Area ke Satu Penarik):**
1. Buka menu **Laporan**
2. Pilih tab **Berdasarkan RW** atau **Berdasarkan RT**
3. Klik tombol **Atur Penarik** pada baris wilayah yang ingin didelegasikan
4. Pilih nama Penarik dari daftar lalu klik **Terapkan**

**Assign Per-WP:**
1. Buka menu **Data Pajak**
2. Temukan nama WP yang ingin dialihkan
3. Klik ikon **Edit** pada baris tersebut dan pilih penarik yang tepat

---

### 4. Mengelola Akun Pengguna

1. Buka menu **Pengguna**
2. Klik **Tambah Akun** untuk membuat pengguna baru
   - Password awal: sesuai konfigurasi (default: `pbb12345`)
   - Informasikan password ini ke pengguna bersangkutan untuk segera diganti
3. Klik ikon ✏️ pada kartu pengguna untuk mengubah data atau peran
4. Klik ikon 🔑 di dalam form edit untuk **Reset Password** ke password default
5. Klik ikon 🗑️ untuk menghapus akun (khusus non-Admin)

---

### 5. Memantau Aktivitas Sistem

1. Buka menu **Log Aktivitas**
2. Gunakan kolom pencarian untuk mencari berdasarkan:
   - Nama pengguna
   - Jenis aksi (contoh: `LOGIN`, `UPDATE_PAYMENT`, `DELETE_USER`)
   - Nama WP atau entitas terkait
3. Setiap perubahan tercatat lengkap: **siapa, apa, kapan**

---

### 6. Backup & Restore Data

**Backup Rutin (disarankan seminggu sekali):**
1. Buka **Pengaturan > Utilitas & Keamanan**
2. Klik **Unduh File Backup** — file SQL akan otomatis terunduh
3. Simpan file backup di lokasi aman (flashdisk / cloud storage)

**Restore Database:**
1. Di halaman yang sama, klik **Pulihkan Database**
2. Pilih file backup (.sql) yang ingin dipulihkan
3. Konfirmasi — data saat ini akan diganti dengan isi backup

**⚠️ Hapus Seluruh Data (Reset Tahun Pajak):**
1. Klik **Hapus Seluruh Data** — hanya untuk pergantian tahun pajak
2. Ketik **`HAPUS SEMUA DATA`** di kolom konfirmasi
3. Klik **Ya, Bersihkan Database**
4. Tindakan ini **tidak dapat dibatalkan** — pastikan backup sudah ada

---

## 📱 Panduan Penarik Pajak

### 1. Membuka Aplikasi di HP

1. Buka browser (Chrome/Safari), masukkan alamat yang diberikan Admin  
   Contoh: `http://192.168.1.1:3000`
2. Masukkan **username** dan **password** yang diberikan oleh Admin
3. Setelah login, segera ganti password di **Pengaturan > Profil**

---

### 2. Menandai Wajib Pajak Sudah Lunas

Ini adalah tugas utama saat bertemu langsung dengan warga:

1. Buka menu **Data Pajak**
2. Cari nama warga menggunakan kotak pencarian (nama, NOP, atau alamat)
3. Klik badge status **Belum Lunas** (warna merah) pada baris warga yang sudah membayar
4. Konfirmasi di dialog yang muncul → klik **Tandai Lunas**
5. Status berubah menjadi **Lunas** (hijau) dan tercatat otomatis dengan waktu pembayaran

---

### 3. Mengalihkan Tagihan ke Penarik Lain

Jika Wajib Pajak ternyata bukan di wilayah tanggung jawab Anda:

1. Di tabel **Data Pajak**, klik ikon **⇄ Transfer** pada baris WP tersebut
2. Pilih jenis: **Serahkan** (kirim ke penarik lain) atau **Ambil Alih** (minta dari penarik lain)
3. Pilih nama Penarik tujuan dan tulis pesan opsional
4. Klik **Kirim Permintaan** — Penarik tujuan akan mendapat notifikasi untuk menyetujui/menolak

---

### 4. Melihat Notifikasi Transfer

1. Klik ikon 🔔 di sudut kanan atas
2. Notifikasi transfer masuk akan tampil di sini
3. Buka detail untuk **Setujui** atau **Tolak** permintaan

---

## 🛡️ Panduan Pengguna (Akun Baru)

Akun baru secara default mendapat peran **PENGGUNA** dengan akses hanya-baca.

Yang bisa dilakukan:
- Melihat data pajak (tidak bisa mengubah)
- Melihat laporan
- Mengubah password sendiri di **Pengaturan > Profil**

Untuk mendapatkan akses lebih, hubungi **Admin** untuk menaikkan peran menjadi **PENARIK**.

---

## ❓ FAQ & Troubleshooting

**Q: Saya lupa password, bagaimana cara reset?**  
Hubungi Admin untuk melakukan reset password. Admin bisa mereset password dari menu **Pengguna > Edit**.

**Q: Login terus gagal padahal username & password sudah benar?**  
Pastikan tidak ada spasi di awal/akhir username. Jika muncul pesan *"Terlalu banyak percobaan"*, tunggu 15 menit sebelum mencoba lagi.

**Q: Status WP tidak berubah setelah ditandai Lunas?**  
Coba refresh halaman. Jika masih tidak berubah, pastikan koneksi internet stabil dan coba lagi.

**Q: Error saat upload Excel?**  
- Pastikan format file adalah `.xlsx` (bukan `.xls` atau `.csv`)
- Pastikan kolom di Excel sesuai dengan format template yang bisa diunduh
- Pastikan tidak ada baris kosong di tengah data

**Q: Aplikasi lambat di HP?**  
Coba close tab browser lain. Gunakan Chrome versi terbaru untuk performa optimal.

---

*Dokumentasi terakhir diperbarui: Maret 2026*
