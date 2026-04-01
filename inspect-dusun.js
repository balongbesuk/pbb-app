const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.taxData.findMany({
    where: { tahun: 2026, OR: [{ nop: { contains: "388" } }, { nop: { contains: "338" } }] }
  });
  console.log("388 / 338 RESULTS:");
  result.forEach(r => console.log(r.nop, "|", r.namaWp, "|", r.dusun));
  
  const dusuns = await prisma.taxData.findMany({
    where: { tahun: 2026 },
    select: { dusun: true },
    distinct: ["dusun"]
  });
  console.log("\nUNIQUE DUSUNS:");
  dusuns.forEach(d => console.log("=> '" + d.dusun + "'"));
}

main().catch(console.error).finally(() => prisma.$disconnect());
