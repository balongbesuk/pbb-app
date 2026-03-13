const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.taxData.count({
    where: {
      OR: [
        { rt: null },
        { rt: "" },
        { rw: null },
        { rw: "" }
      ]
    }
  });
  console.log(`Jumlah TaxData dengan RT/RW kosong: ${count}`);
  
  const mappingCount = await prisma.taxMapping.count({
    where: {
      OR: [
        { rt: "" },
        { rw: "" }
      ]
    }
  });
  console.log(`Jumlah TaxMapping dengan RT/RW kosong: ${mappingCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
