const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function main() {
  console.log('🚀 Menjalankan Inisialisasi Aplikasi Otomatis...');

  const rootDir = path.join(__dirname, '..');
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');

  // 1. Cek .env
  if (!fs.existsSync(envPath)) {
    console.log('📝 .env tidak ditemukan, menduplikasi dari .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
  }

  // 2. Jalankan Perintah Prisma
  try {
    console.log('🛠️  Menyiapkan database (Prisma)...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push', { stdio: 'inherit' });
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('\n✅ Semua beres! Database sudah siap digunakan.');
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat menyiapkan database.');
    console.error('Anda mungkin perlu menjalankannya secara manual nantinya.');
  }
}

main();
