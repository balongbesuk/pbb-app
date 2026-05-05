const Database = require('better-sqlite3');
const db = new Database('dev.db');

const rows = db.prepare("SELECT id, tanggalBayar, paymentStatus, pembayaran FROM TaxData WHERE paymentStatus = 'LUNAS'").all();

console.log("Total LUNAS rows:", rows.length);

const results = {
  iso: 0,
  nonIso: [],
  nulls: 0,
  years: {},
  months: {}
};

rows.forEach(r => {
  if (!r.tanggalBayar) {
    results.nulls++;
    return;
  }
  
  if (typeof r.tanggalBayar === 'string' && r.tanggalBayar.includes('T')) {
    results.iso++;
  } else {
    results.nonIso.push({ id: r.id, val: r.tanggalBayar });
  }

  try {
    const d = new Date(r.tanggalBayar);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${month}`;
      results.years[year] = (results.years[year] || 0) + 1;
      results.months[key] = (results.months[key] || 0) + 1;
    }
  } catch (e) {}
});

console.log("Results summary:");
console.log("- ISO format:", results.iso);
console.log("- Nulls:", results.nulls);
console.log("- Non-ISO count:", results.nonIso.length);
if (results.nonIso.length > 0) {
  console.log("- Non-ISO samples:", results.nonIso.slice(0, 5));
}
console.log("- Years distribution:", results.years);
console.log("- Months distribution:", results.months);
