const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        username: true,
        mustChangePassword: true
      }
    });
    console.log("Success:", user);
  } catch (error) {
    console.error("Error detected:", error.message);
    if (error.message.includes("mustChangePassword")) {
      console.log("CONFIRMED: Column 'mustChangePassword' is missing from the database.");
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
