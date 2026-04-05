# Panduan Penggunaan PBB Manager

Selamat datang di **PBB Manager** — sistem digital untuk mempercepat pendataan dan penarikan Pajak Bumi dan Bangunan secara transparan dan terkoordinasi.

---

## Pengenalan Peran Pengguna

Setiap pengguna beroperasi sesuai peran yang ditetapkan oleh Admin.

| Peran | Lambang | Akses |
|---|---|---|
| **ADMIN** | [ADMIN] | Penuh — kelola semua fitur sistem |
| **PENARIK** | [MOBILE] | Lapangan — tagih WP di wilayah sendiri |
| **PENGGUNA** | [VIEWER] | Hanya-baca — belum punya izin operasional |

---

## Panduan Admin

### 1. Login & Keamanan Akun

1. Buka aplikasi di browser, masukkan **username** dan **password**
2. Setelah login pertama kali, segera ganti password di **Pengaturan > Profil > Ganti Password**
3. Sesi akan otomatis berakhir setelah **8 jam** tidak aktif
4. **Branding & Logo**: Identitas portal warga diatur di menu **Pengaturan > Profil Instansi**. Logo dan nama yang diubah di sana akan otomatis muncul di halaman depan dan halaman login.

> PENTING: Sistem membatasi **10 percobaan login gagal** per 15 menit untuk mencegah akses tidak sah.

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
2. **Assign Per Baris**: Temukan nama WP, klik ikon Edit (titik tiga atau pensil) dan pilih penarik yang tepat.
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
   - Password awal: sesuai pengaturan server (`DEFAULT_USER_PASSWORD` di `.env`)
   - Informasikan password ini ke petugas untuk segera diganti
3. Klik ikon Edit pada kartu pengguna untuk mengubah data atau peran
4. Klik ikon Kunci di dalam form edit untuk **Reset Password** ke password default server
5. Klik ikon Hapus untuk menghapus akun (khusus non-Admin)

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

**Restore Database (Paling Aman):**
1. Di halaman Utilitas, klik **Pulihkan Database**
2. Pilih file cadangan (.zip atau .db) yang ingin dipulihkan
3. Klik **Mulai Pemulihan**. 
4. **Sistem Terproteksi (v3.0)**: Sistem menggunakan **Atomic Swap & Rollback**. Database akan diperiksa di folder staging terlebih dahulu. Jika file rusak atau gagal ekstrak, sistem otomatis membatalkan perubahan dan mengembalikan database lama secara instan tanpa merusak data Anda.
5. Konfirmasi — Sesi Anda akan otomatis keluar (Log Out) untuk sinkronisasi pemulihan.

**Memulihkan Alokasi Penarik (Restore Alokasi):**
Jika Anda baru saja mengimpor data PBB tahun baru dan datanya masih kosong (Tanpa Petugas), gunakan fitur ini:
1. Buka menu **Pengaturan > Konfigurasi & Backup**
2. Klik **Backup & Restore Alokasi**
3. Pilih file Excel backup alokasi yang pernah Anda buat sebelumnya.
4. Klik **Pulihkan Alokasi** — sistem akan memetakan ulang petugas berdasarkan NOP secara otomatis.

**Hapus Seluruh Data (Reset Tahun Pajak):**
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

### 9. Manajemen Peta Wilayah (GIS) (v8.0)

PBB Manager v8.0 kini dilengkapi dengan **GIS Command Center** untuk visualisasi wilayah kerja secara spasial di atas peta citra satelit.

**A. Mengatur Titik Pusat Peta (Map Picker):**
1. Buka menu **Pengaturan > Pengaturan Sistem**
2. Klik tab **Peta**
3. Anda akan melihat peta interaktif. Klik tombol **Pilih Lokasi di Peta**
4. Cari lokasi desa Anda, lalu **klik langsung pada peta** untuk menentukan titik koordinat Latitude & Longitude secara otomatis.
5. Gunakan tombol **Simpan Koordinat** untuk menerapkan perubahan.

**B. Upload Data Wilayah (GPX Pipeline):**
1. Masih di tab **Peta**, cari bagian **Data Peta Wilayah**
2. Klik tombol **Upload GPX**
3. Pilih satu atau banyak file GPX hasil pemetaan (Contoh: `Dusun Krajan RT01.gpx`)
4. **Sistem Ekstraksi Otomatis**: Sistem akan membaca nama file untuk menentukan RT/RW/Dusun secara cerdas.
5. Klik **Mulai Unggah**. Data akan langsung terkonversi menjadi area wilayah (Polygon) di peta utama.

**C. Visualisasi & Filter Peta:**
1. Buka menu **Dashboard** atau menu khusus **Peta**
2. Gunakan tombol **Ganti Layer** (kanan atas peta) untuk berpindah antara tampilan **Jalanan** atau **Satelit (World Imagery)**.
3. Gunakan filter **Layer Wilayah**: Anda dapat menampilkan/menyembunyikan batas RT, RW, atau Dusun sesuai ketersediaan data.
4. Klik pada area wilayah di peta untuk melihat metadata (Nama Dusun/RT/RW) secara instan.

---

### 10. Portal Mutasi & Cetak Dokumen SPOP (v7.1)

Fitur *Self-Service* mempermudah warga untuk mengelola pengajuan perubahan data SPPT PBB (Mutasi, Balik Nama, Pemecahan) secara mandiri.
1. **Portal Publik**: Warga bisa mengakses form pengajuan mutasi ini dari halaman pencarian publik (*Public Search*) dengan mengklik opsi mutasi.
2. **Keamanan Formulir**: Formulir meminta data secara aman (dilengkapi kontrol anti-XSS) termasuk input NIK ahli waris/pembeli yang spesifik berjumlah 16 digit.
3. **Cetak Dokumen SPOP**: Admin dapat melakukan review data dan menggunakan fitur cetak PDF. Dokumen Form SPOP/LSPOP otomatis diformat seukuran kertas **F4/Fullfolio**, kop tanpa logo burung garuda, dengan tipografi dinamis `12px` yang tetap rapi meski dibuka melalui ponsel.
4. **Otomatisasi Profil Desa**: Rincian profil seperti (alamat balai desa, kodepos, nama kepala desa) yang disetel di menu Profil Instansi otomatis diintegrasikan ke format dokumen surat keterangan ini.

---

### 11. Memulihkan Akun Admin (Reset Password Server)

Jika Anda lupa password akun utama `admin` dan tidak bisa masuk sama sekali, Anda dapat melakukan *reset* paksa langsung dari server dengan memodifikasi konfigurasi database. Langkah ini aman dan tidak akan menghapus data warga.

1. Buka folder instalasi proyek PBB Manager di server/komputer Anda.
2. Buka file `.env` menggunakan teks editor (seperti Notepad / VS Code).
3. Cari baris `ADMIN_PASSWORD=` dan ubah nilainya menjadi password sementara.
   Contoh: `ADMIN_PASSWORD=PasswordBaruAdmin123!`
4. Simpan perubahan pada file `.env`.
5. Buka **Terminal** atau **Command Prompt** di folder proyek tersebut, lalu jalankan perintah pemulihan *seed* berikut:
   ```bash
   npx prisma db seed
   ```
6. Tunggu hingga proses memunculkan tulisan *Pembersihan data wilayah otomatis selesai*.
7. Sekarang Anda dapat masuk (*Login*) ke aplikasi menggunakan username `admin` dan *password* sementara yang baru saja Anda atur. Setelah berhasil masuk, sistem akan meminta Anda untuk segera mengubah *password* tersebut demi keamanan lanjutan.

---

## Panduan Penarik Pajak

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

1. Di tabel **Data Pajak**, klik ikon Transfer pada baris WP tersebut
2. Pilih jenis: **Serahkan** (kirim ke penarik lain) atau **Ambil Alih** (minta dari penarik lain)
3. Pilih nama Penarik tujuan dan tulis pesan opsional
4. **Proteksi Peran**: Pemindahan hanya dapat dilakukan antar petugas aktif (**PENARIK**). Admin tidak muncul di menu ini karena Admin mengelola penugasan langsung via alokasi masal.
5. Klik **Kirim Permintaan** — Penarik tujuan akan mendapat notifikasi untuk menyetujui/menolak di dalam transaksi aman.

---

### 4. Melihat Notifikasi Transfer

1. Klik ikon lonceng di sudut kanan atas
2. Notifikasi transfer masuk akan tampil di sini
3. Buka detail untuk **Setujui** atau **Tolak** permintaan

---

## Panduan Pengguna (Akun Baru)

Akun baru secara default mendapat peran **PENGGUNA** dengan akses hanya-baca.

Yang bisa dilakukan:
- Melihat data pajak (tidak bisa mengubah)
- Melihat laporan
- Mengubah password sendiri di **Pengaturan > Profil**

Untuk mendapatkan akses lebih, hubungi **Admin** untuk menaikkan peran menjadi **PENARIK**.

---

## FAQ & Troubleshooting

**Q: Saya lupa password, bagaimana cara reset?**  
Hubungi Admin untuk melakukan reset password. Admin bisa mereset password dari menu **Pengguna > Edit** dengan menekan ikon kunci. Namun, jika Anda yang lupa adalah sang Admin sendiri, **silakan merujuk pada Panduan Admin poin ke-11 di atas (Memulihkan Akun Admin)**.

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

*Dokumentasi terakhir diperbarui: 2 April 2026 (v8.0 - The GIS Revolution)*
