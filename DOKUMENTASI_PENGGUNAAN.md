# 📖 Buku Pintar & Panduan Penggunaan PBB Manager

Selamat datang di PBB Manager, sebuah inovasi digital untuk mempercepat pendataan dan penarikan pajak di Desa secara transparan dan aman.

---

## 👥 Pengenalan Hak Akses (*Roles*)
Setiap pengguna diwajibkan untuk beroperasi sesuai jenis jabatannya.

1. **👑 ADMIN (Kepala Desa / Pejabat IT / Admin Pusat)**
   - Dapat mereset, mem-backup, dan menghancurkan seluruh data.
   - Mengendalikan pembuatan Akun Pengguna / menaikkan jabatan Penarik.
   - Dapat memata-matai semua aktivitas yang dilakukan bawahan di dalam sistem (*Log Audit*).
   - Menguasai fitur Import DHKP dari Excel dan mencetak Laporan Kelurahan.
   - Mengatur Pemetaan (Delegasi) RW/RT ke tiap *Penarik Pajak*.
2. **📱 PENARIK (Kepala Dusun / Ujung Fokus Lapangan)**
   - Menggunakan sistem di genggaman HP secara responsif.
   - Memiliki akses lapangan memungut uang dan mengubah tombol **Belum Lunas** ➔ **Lunas**.
   - Hanya perlu berfokus pada nama warga di wilayah kewenangannya.
3. **🛡️ PENGGUNA (Akun Baru / Standar)**
   - Peran bawaan saat *User* baru pertama kali dibuat.
   - Hak akses sangat minimal (hanya-baca) yang akan dipromosikan ke tingkat selanjutnya apabila dikonfirmasi oleh **ADMIN**.

---

## 🚀 Panduan Admin (Operasi Balai Desa)

### 1. Memulai Tahun Pajak Baru
Setiap tahun baru, sebelum Excel PBB dibagikan ke warga, Admin harus menyiapkan database:
1. Pastikan menu **Pengaturan > Referensi Dusun** sudah diisi dengan nama persis sesuai yang sering diketik orang di Excel.
2. Buka menu **Upload Data PBB**.
3. Di sana, Anda bisa klik tombol "Format Excel" jika bingung bentuk kolom urutan data aslinya.
4. Tentukan **Tahun Pajak** (Misal: 2026).
5. Masukkan file Excel (maksimal puluhan ribu baris) lalu klik **Mulai Import**.

### 2. Membagi Rombongan Wajib Pajak (Mapping Area)
Apakah Anda ingin Kepala Dusun X cuma bisa menagih di RW 01?
1. Masuk menu **Laporan**.
2. Klik tab **Berdasarkan RW** atau **Berdasarkan RT**.
3. Pada tabel wilayah tersebut, klik tombol ajaib biru bertulisan **Atur Penarik Masal**.
4. Muncul *Popup*: Pilih jabatan/nama "Penarik" targetnya.
5. Klik **Terapkan**. Ratusan NOP / surat tagihan otomatis masuk ke penarik tersebut secara kilat.

### 3. Mengawasi Dana & Operasional
1. **Cek Pemasukan Real-Time**: Buka layar muka utama (Dashboard). Angka hijau persentase pencapaian serta klasemen "Top Kolektor" tidak bisa ditipu.
2. **Mengusut Pelaku Penipuan/Kesalahan**: Buka layar **Log Aktivitas**. 
   - Pilih *Action*: `MARK_PAID` atau `TRANSFER`.
   - Cari kata kunci nama warga. Sistem akan memberitahu detail "Pada jam berapa Penarik siapa" yang memalsukan data.

### 4. Backup Data Mingguan (Darurat)
1. Pergi ke **Pengaturan > Utilitas & Keamanan**.
2. Tekan **Unduh File Backup**.
3. Sistem akan membuat bungkusan `pbb_backup_...zip`. Simpan ini di Flashdisk / Google Drive.

---

## 📱 Panduan Penarik Pajak (Operasi Lapangan)

### 1. Membuka Aplikasi di HP
Aplikasi ini dirancang responsif untuk memudahkan penggunaan di perangkat mobile.
1. Buka Chrome Android / Safari iPhone, lalu masukkan Link yang diberikan Kepala Desa (contoh: `192.168.1.1:3000`).
2. Masukkan Username dan Password Anda untuk masuk ke sistem.

### 2. Melatih Jempol Mengutip Pajak
Ini pekerjaan utama Anda saat bertamu ke pintu warga.
1. Klik dan masuk ke **Data Pajak**.
2. Anda bisa mengetik nama pak RT, atau nama spesifik Mbah di kotak pensil (Pencarian).
3. Jika bapak/ibu tersebut sudah bayar uang lembaran rupiahnya ke Anda, tekan status tagihan berwarna Merah (**Belum Lunas**).
4. Kotak persetujuan kecil akan muncul, lalu tekan **"Tandai Lunas"**. 

### 3. Oper Over Tagihan (Memindah Warga)
Jika si Wajib Pajak ternyata salah tempat dan bukan tanggung jawab Anda:
1. Pada tabel Data Pajak tersebut, buka tombol titik tiga (`...`) di nama orangnya.
2. Pilih **"Pindah Penugas / Alihkan Otoritas"**.
3. Cari nama Penarik target sasaran Anda.
4. Notifikasi akan diteruskan ke Penarik/Admin target untuk persetujuan (Acc).

---
*Manual ini disesuaikan untuk update terakhir - 2026*
