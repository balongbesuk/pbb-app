const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.villageConfig.findFirst({ where: { id: 1 } });
  if (config) {
    await prisma.villageConfig.update({
      where: { id: 1 },
      data: { enableBapendaSync: true }
    });
    console.log("Config updated: enableBapendaSync = true");
  } else {
    console.log("Config not found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
