const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Memulai pembersihan data RT/RW...");

  // 1. Perbaiki TaxData
  const taxDataUpdate = await prisma.taxData.updateMany({
    where: {
      OR: [
        { rt: null },
        { rt: "" },
        { rw: null },
        { rw: "" }
      ]
    },
    data: {
      rt: { set: "00" }, // Menggunakan logic: jika salah satu null/kosong, set keduanya atau individu
    }
  });

  // Karena updateMany tidak bisa conditional per field dengan mudah untuk null vs empty, 
  // kita lakukan step by step yang lebih presisi
  
  const fixRT = await prisma.taxData.updateMany({
    where: { OR: [{ rt: null }, { rt: "" }] },
    data: { rt: "00" }
  });
  console.log(`Berhasil memperbaiki ${fixRT.count} baris RT di TaxData.`);

  const fixRW = await prisma.taxData.updateMany({
    where: { OR: [{ rw: null }, { rw: "" }] },
    data: { rw: "00" }
  });
  console.log(`Berhasil memperbaiki ${fixRW.count} baris RW di TaxData.`);

  // 2. Perbaiki TaxMapping (Referensi Penugasan)
  const fixMappingRT = await prisma.taxMapping.updateMany({
    where: { rt: "" },
    data: { rt: "00" }
  });
  console.log(`Berhasil memperbaiki ${fixMappingRT.count} baris RT di TaxMapping.`);

  const fixMappingRW = await prisma.taxMapping.updateMany({
    where: { rw: "" },
    data: { rw: "00" }
  });
  console.log(`Berhasil memperbaiki ${fixMappingRW.count} baris RW di TaxMapping.`);

  console.log("Pembersihan selesai.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
