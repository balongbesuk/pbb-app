const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { username: "admin" }
  });
  
  if (!user) {
    console.log("User admin tidak ditemukan");
    return;
  }
  
  const isMatch = await bcrypt.compare("admin123", user.password);
  console.log(`Password admin123 matching: ${isMatch}`);
  console.log(`Hashed password in DB: ${user.password}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
