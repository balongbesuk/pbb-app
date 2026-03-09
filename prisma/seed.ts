const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  console.log({ admin });

  // Add some default dusun references
  const dusuns = ["BALONGBESUK", "KARANGASEM", "SUMBERAGUNG", "KRAJAN"];
  for (const name of dusuns) {
    await prisma.dusunReference.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
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
