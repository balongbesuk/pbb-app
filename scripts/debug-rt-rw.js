const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const taxes = await prisma.taxData.findMany({
    where: {
      nop: {
        in: [
          "35.17.130.017.002-0158.0",
          "35.17.130.017.009-0242.0"
        ]
      }
    },
    select: {
      nop: true,
      namaWp: true,
      rt: true,
      rw: true,
      dusun: true,
      alamatObjek: true
    }
  });
  console.log(JSON.stringify(taxes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
