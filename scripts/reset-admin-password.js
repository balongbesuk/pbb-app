const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Membaca .env secara manual jika ada
const envPath = path.join(__dirname, '..', '.env');
let databaseUrl = 'file:./dev.db';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^DATABASE_URL=["']?([^"\n\r']+)["']?/m);
  if (match && match[1]) {
    databaseUrl = match[1];
  }
}

console.log(`Database URL: ${databaseUrl}`);

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const newPassword = 'admin123';
  const hash = await bcrypt.hash(newPassword, 10);
  
  // Cari user admin
  const user = await prisma.user.update({
    where: { username: 'admin' },
    data: {
      password: hash,
      mustChangePassword: true
    }
  });
  console.log(`✅ Password admin di database berhasil direset menjadi: ${newPassword}`);
}

main()
  .catch((err) => {
    console.error('❌ Gagal mereset password:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
