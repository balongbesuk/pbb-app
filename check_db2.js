const Database = require('better-sqlite3');
const db = new Database('dev.db');
const rows = db.prepare("SELECT id, tanggalBayar, pembayaran, tahun FROM TaxData WHERE paymentStatus = 'LUNAS' LIMIT 10").all();
console.log("Sample LUNAS rows:");
console.log(rows);
const mayRows = db.prepare("SELECT id, tanggalBayar, pembayaran, tahun FROM TaxData WHERE paymentStatus = 'LUNAS'").all().filter(r => {
  if (!r.tanggalBayar) return false;
  // If it's a number (unix ms) or string
  const d = new Date(Number.isInteger(r.tanggalBayar) ? r.tanggalBayar : r.tanggalBayar);
  return d.getMonth() === 4;
});
console.log("May Rows length:", mayRows.length);
if (mayRows.length > 0) console.log("May Sample:", mayRows[0]);
