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
    },
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  console.log({ admin });
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
