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
4. **Branding & Logo**: Identitas portal warga diatur di menu **Pengaturan > Profil Instansi**. Logo dan nama yang diubah di sana akan otomatis muncul di halaman depan dan halaman login.

> ⚠️ Sistem membatasi **10 percobaan login gagal** per 15 menit untuk mencegah akses tidak sah.

---

### 2. Memulai Tahun Pajak Baru

Setiap awal tahun, lakukan langkah berikut sebelum Excel DHKP dibagikan:

**A. Siapkan Referensi Dusun**
1. Buka menu **Pengaturan > Referensi Dusun**
2. Tambahkan nama semua dusun yang ada persis sesuai penulisan di file Excel
3. Daftar ini digunakan sistem untuk mendeteksi dan memetakan alamat secara otomatis

**B. Upload Data PBB (Smart Sync)**
1. Buka menu **Upload Data PBB**
2. Pilih **Tahun Pajak** (contoh: 2026)
3. Pilih file Excel DHKP (.xlsx atau .xls)
4. Klik **Mulai Sinkronisasi**
5. **Fitur Smart Sync**: 
   - Sistem otomatis mendeteksi jika data sudah ada.
   - **Update Otomatis**: Jika data sudah ada, status di sistem akan diperbarui mengikuti file terbaru.
   - **Proteksi Data**: Data lama yang *tidak ada* di file baru akan tetap aman (tidak dihapus/tidak berubah status).
   - **Autoproses**: Data yang sudah hilang dari DHKP terbaru otomatis ditandai Lunas dengan nilai pembayaran penuh.
6. Tunggu proses selesai — sistem akan menampilkan ringkasan hasil sinkronisasi.

---

### 3. Membagi Wilayah & Mendelegasikan Penarik

**Bulk Assign (Satu Area ke Satu Penarik):**
1. Buka menu **Laporan**
2. Pilih tab **Berdasarkan RW** atau **Berdasarkan RT**
3. Klik tombol **Atur Penarik** pada baris wilayah yang ingin didelegasikan
4. Pilih nama Penarik dari daftar lalu klik **Terapkan**

**Assign Per-WP & Smart Selection:**
1. Buka menu **Data Pajak**
2. **Assign Per Baris**: Temukan nama WP, klik ikon **Edit** (titik tiga atau pensil) dan pilih penarik yang tepat.
3. **Smart Selection (Alokasi Masal)**:
   - Gunakan filter (Dusun/RT/RW/Cari Nama) untuk memunculkan kelompok data tertentu.
   - Klik ceklist pada judul tabel untuk memilih semua data di halaman tersebut.
   - Klik tombol **"Pilih seluruh [X] data sesuai filter"** yang muncul di bar biru atas.
   - Klik **Alokasikan** dan pilih nama petugas — seluruh data hasil filter akan dialihkan sekaligus tanpa terbatas paginasi.
4. **Update Wilayah Masal**: Gunakan cara yang sama, lalu pilih **Atur Wilayah** untuk memperbaiki nama Dusun/RT/RW secara serentak.

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

**Backup Alokasi Penarik (Sangat Penting):**
1. Buka menu **Pengaturan > Konfigurasi & Backup**
2. Klik **Backup Alokasi Penarik (Excel)**
3. File Excel yang terunduh berisi daftar Wajib Pajak lengkap dengan petugasnya saat ini. Simpan file ini sebagai referensi alokasi tahun depan.

**Restore Database:**
1. Di halaman Utilitas, klik **Pulihkan Database**
2. Pilih file backup (.sql) yang ingin dipulihkan
3. Konfirmasi — data saat ini akan diganti dengan isi backup

**Memulihkan Alokasi Penarik (Restore Alokasi):**
Jika Anda baru saja mengimpor data PBB tahun baru dan datanya masih kosong (Tanpa Petugas), gunakan fitur ini:
1. Buka menu **Pengaturan > Konfigurasi & Backup**
2. Klik **Backup & Restore Alokasi**
3. Pilih file Excel backup alokasi yang pernah Anda buat sebelumnya.
4. Klik **Pulihkan Alokasi** — sistem akan memetakan ulang petugas berdasarkan NOP secara otomatis.

**⚠️ Hapus Seluruh Data (Reset Tahun Pajak):**
1. Klik **Hapus Seluruh Data** — hanya untuk pergantian tahun pajak
2. Ketik **`HAPUS SEMUA DATA`** di kolom konfirmasi
3. Klik **Ya, Bersihkan Database**
4. Tindakan ini **tidak dapat dibatalkan** — pastikan backup sudah ada

---

### 7. Pengaturan Branding & Portal Warga

Portal depan adalah wajah layanan publik Anda. Admin bisa menyesuaikannya:
1. Buka **Pengaturan > Profil Instansi**
2. **Ganti Logo**: Upload file gambar logo desa (rekomendasi: .png transparan).
3. **Nama Desa/Kec/Kab**: Sesuaikan penulisan. Tips: Tuliskan dengan format Title Case agar tampil cantik di web.
4. Simpan Perubahan. Logo dan identitas baru akan langsung aktif di **Halaman Depan** dan **Halaman Login**.

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
Hubungi Admin untuk melakukan reset password. Admin bisa mereset password dari menu **Pengguna > Edit** dengan menekan ikon kunci 🔑.

**Q: Apakah data saya akan hilang jika saya upload file Excel baru?**  
**TIDAK.** Dengan fitur *Smart Sync* v2.0, sistem hanya akan memperbarui data yang ada di file Excel. Data lama yang sudah ada di sistem tapi tidak ada di file Excel baru akan tetap aman (tidak dihapus).

**Q: Jenis file Excel apa yang didukung?**  
Sistem mendukung file format modern `.xlsx` dan juga format lama `.xls` (DHKP dari sistem lama).

**Q: Bisa tidak saya memindahkan ratusan WP ke petugas lain sekaligus?**  
**BISA.** Gunakan fitur *Smart Selection* di menu **Data Pajak**. Filter data yang diinginkan, klik ceklist di judul tabel, lalu klik *"Pilih seluruh [X] data sesuai filter"* untuk melakukan alokasi masal.

**Q: Bagaimana jika saya salah mengalokasikan ratusan data?**  
Tenang, gunakan filter yang sama, pilih semua data lagi, lalu klik **Alokasikan** ke petugas yang benar. Sistem akan menimpa data petugas lama dengan yang baru.

**Q: Apakah aman jika saya menggunakan WiFi umum?**  
Sistem dilengkapi enkripsi sesi dan audit trail. Namun, disarankan tetap menggunakan koneksi pribadi dan selalu klik **Logout** setelah selesai menggunakan aplikasi.

**Q: Error saat upload Excel?**  
- Pastikan kolom di Excel sesuai dengan format template (bisa diunduh di menu Upload).
- Pastikan tidak ada karakter aneh atau baris yang benar-benar kosong di tengah data.
- Pastikan Tahun Pajak yang dipilih sudah sesuai.

**Q: Aplikasi lambat di HP?**  
Tampilan v2.0 sudah dioptimalkan. Jika terasa lambat, coba bersihkan *cache* browser atau gunakan Google Chrome versi terbaru.

---

*Dokumentasi terakhir diperbarui: 13 Maret 2026 (v2.0 - Smart Sync & Bulk Allocation Update)*
