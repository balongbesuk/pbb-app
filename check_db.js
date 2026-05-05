const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.taxData.findMany({
    where: { paymentStatus: 'LUNAS', tanggalBayar: { not: null } },
    select: { tanggalBayar: true, pembayaran: true }
  });
  console.log("Total lunas with tanggalBayar:", data.length);
  const mayData = data.filter(d => {
    const date = new Date(d.tanggalBayar);
    return date.getFullYear() === 2026 && date.getMonth() === 4;
  });
  console.log("May 2026 data:", mayData.length);
  if (data.length > 0) {
    console.log("Sample:", data[0].tanggalBayar);
  }
}
main();
