const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const query = "388";
  const filterDusun = "BALONGBESUK";
  
  const cleanQuery = query.replace(/[.\-\s]/g, "");
  const upperQuery = query.toUpperCase();
  const lowerQuery = query.toLowerCase();
  
  const orConditions = [
    { nop: { contains: query } },
    { namaWp: { contains: query } },
    { namaWp: { contains: upperQuery } },
    { namaWp: { contains: lowerQuery } },
    { alamatObjek: { contains: query } },
    { alamatObjek: { contains: upperQuery } },
  ];
  
  if (cleanQuery !== query && cleanQuery.length >= 3) {
    orConditions.push({ nop: { contains: cleanQuery } });
  }
  
  const result = await prisma.taxData.findMany({
    where: { 
      tahun: 2026, 
      dusun: filterDusun,
      AND: [{ OR: orConditions }]
    }
  });
  console.log("388 + BALONGBESUK RESULTS:");
  result.forEach(r => console.log(r.nop, "|", r.namaWp, "|", r.dusun));
}

main().catch(console.error).finally(() => prisma.$disconnect());
