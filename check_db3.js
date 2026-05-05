const Database = require('better-sqlite3');
const db = new Database('dev.db');
const mayRows = db.prepare("SELECT id, tanggalBayar, paymentStatus, pembayaran, tahun FROM TaxData WHERE tanggalBayar LIKE '%2026-05%'").all();
console.log("May Rows (by LIKE string):", mayRows.length);
if (mayRows.length > 0) console.log(mayRows);

const mayRows2 = db.prepare("SELECT id, tanggalBayar, paymentStatus, pembayaran, tahun FROM TaxData").all().filter(r => {
  if (!r.tanggalBayar) return false;
  const d = new Date(r.tanggalBayar);
  return d.getMonth() === 4 && d.getFullYear() === 2026;
});
console.log("May Rows (by Date parse):", mayRows2.length);
if (mayRows2.length > 0) console.log(mayRows2.slice(0, 5));
