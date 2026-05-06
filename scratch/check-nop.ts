import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const samples = await prisma.taxData.findMany({
    take: 5,
    select: { nop: true }
  });
  console.log('NOP Samples:', JSON.stringify(samples, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
