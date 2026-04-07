const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) {
    throw new Error("❌ ERROR: ADMIN_PASSWORD environment variable is not defined! Seed process halted.");
  }
  const hashedPassword = await bcrypt.hash(adminPass, 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      mustChangePassword: true,
    },
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      mustChangePassword: true,
    },
  });

  console.log({ admin });

  // 1. Perbaiki TaxData RT/RW yang kosong/null
  await prisma.taxData.updateMany({
    where: { OR: [{ rt: null }, { rt: "" }] },
    data: { rt: "00" }
  });
  await prisma.taxData.updateMany({
    where: { OR: [{ rw: null }, { rw: "" }] },
    data: { rw: "00" }
  });

  // 2. Perbaiki TaxMapping RT/RW yang kosong
  await prisma.taxMapping.updateMany({
    where: { rt: "" },
    data: { rt: "00" }
  });
  await prisma.taxMapping.updateMany({
    where: { rw: "" },
    data: { rw: "00" }
  });

  console.log("Pembersihan data wilayah otomatis selesai.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
