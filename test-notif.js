const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.notification.findMany({
    include: {
      user: {
        select: { role: true, name: true, username: true }
      }
    }
  });
  console.log("NOTIFS:", JSON.stringify(notifs, null, 2));
  
  const logs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: { role: true, name: true, username: true }
      }
    }
  });
  console.log("LOGS:", JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
