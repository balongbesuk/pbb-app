const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

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
