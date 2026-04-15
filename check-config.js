const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.villageConfig.findFirst({
    where: { id: 1 }
  });
  console.log('--- VILLAGE CONFIG ---');
  console.log(JSON.stringify(config, null, 2));
  console.log('----------------------');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
