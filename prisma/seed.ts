const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
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
