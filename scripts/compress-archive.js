const fs = require('fs');
const path = require('path');
const GhostscriptModule = require('@jspawn/ghostscript-wasm');

const originalFetch = global.fetch;
global.fetch = undefined;

async function runCompression() {
  const Ghostscript = GhostscriptModule.default || GhostscriptModule;
  const gs = await Ghostscript({
    locateFile: (fname) => path.join(process.cwd(), "node_modules", "@jspawn", "ghostscript-wasm", fname)
  });

  const baseDir = path.join(process.cwd(), "public", "arsip-pbb");
  
  if (!fs.existsSync(baseDir)) {
    console.log("❌ Folder arsip-pbb tidak ditemukan.");
    return;
  }

  const years = fs.readdirSync(baseDir);
  let totalCompressed = 0;
  let totalSavedBytes = 0;

  console.log("=======================================");
  console.log("🤖 ROUTINE KOMPRESI ARSIP PBB DIMULAI");
  console.log("=======================================\n");

  for (const year of years) {
    const yearDir = path.join(baseDir, year);
    if (!fs.statSync(yearDir).isDirectory()) continue;

    const files = fs.readdirSync(yearDir).filter(f => f.endsWith('.pdf'));
    
    for (let i = 0; i < files.length; i++) {
        const fname = files[i];
        const filePath = path.join(yearDir, fname);
        const stats = fs.statSync(filePath);
        
        // Kita kompres file yang ukurannya di atas 500 KB (artinya masih mentah / bawaan pdf-lib)
        if (stats.size > 500 * 1024) {
            console.log(`[${i+1}/${files.length}] Mengompres: ${year}/${fname} (${(stats.size/1024).toFixed(0)} KB) ...`);
            
            try {
                const rawBytes = fs.readFileSync(filePath);
                
                // Proses Ghostscript (WASM Virtual Memory)
                gs.FS.writeFile("input.pdf", rawBytes);
                gs.callMain([
                  "-sDEVICE=pdfwrite",
                  "-dCompatibilityLevel=1.4",
                  "-dPDFSETTINGS=/ebook",
                  "-dNOPAUSE",
                  "-dQUIET",
                  "-dBATCH",
                  "-sOutputFile=output.pdf",
                  "input.pdf"
                ]);

                const compressedBytes = gs.FS.readFile("output.pdf");
                const newSize = compressedBytes.length;

                // Tulis balik kalau ukurannya memang lebih kecil
                if (newSize < stats.size && newSize > 0) {
                    fs.writeFileSync(filePath, Buffer.from(compressedBytes));
                    const saved = stats.size - newSize;
                    totalSavedBytes += saved;
                    totalCompressed++;
                    console.log(`    ✅ Selesai! Ukuran menjadi ${(newSize/1024).toFixed(0)} KB (Hemat ${(saved/1024).toFixed(0)} KB)`);
                } else {
                    console.log(`    ⚠️ Dilewati. Tidak bisa lebih kecil.`);
                }
                
                // Cleanup virtual memory
                gs.FS.unlink("input.pdf");
                gs.FS.unlink("output.pdf");
            } catch (err) {
                console.log(`    ❌ Gagal mengompres ${fname}: ${err.message}`);
            }
        }
    }
  }

  console.log("\n=======================================");
  console.log(`✅ PROSES SELESAI!`);
  console.log(`📂 Total File Terkompres: ${totalCompressed} file`);
  console.log(`💾 Penyimpanan Dihemat: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("=======================================");
}

runCompression().catch(console.error).finally(() => {
  global.fetch = originalFetch;
});
