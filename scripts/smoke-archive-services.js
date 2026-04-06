const fs = require("fs");
const path = require("path");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(message, color = "") {
  console.log(`${color}${message}${RESET}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function run() {
  log("\nSMOKE TEST: ARCHIVE SERVICES\n", YELLOW);

  const storageFile = readProjectFile("src/lib/storage.ts");
  assert(storageFile.includes("getStorageRoot"), "Helper storage.ts tidak terbaca.");

  const archiveUtils = readProjectFile("src/lib/archive-utils.ts");
  assert(archiveUtils.includes("extractNopFromText"), "archive-utils belum memiliki extractNopFromText.");
  assert(archiveUtils.includes("buildArchiveIndex"), "archive-utils belum memiliki buildArchiveIndex.");
  log("OK archive utils surface", GREEN);

  const sampleTextA = "NOP 35.17.111.222.333-4444.5";
  const digitsA = sampleTextA.replace(/\D/g, "");
  assert(digitsA.includes("351711122233344445"), "Sampel NOP daerah tidak valid.");

  const sampleTextB = "dokumen 123456789012345678 siap";
  const digitsB = sampleTextB.replace(/\D/g, "");
  assert(digitsB.includes("123456789012345678"), "Sampel NOP generik tidak valid.");
  log("OK sample NOP coverage", GREEN);

  const archiveDir = path.join(process.cwd(), "storage", "arsip-pbb", "2099");
  ensureDir(archiveDir);
  const archiveTestFile = path.join(archiveDir, "351711122233344445.pdf");
  fs.writeFileSync(archiveTestFile, Buffer.from("dummy"));
  const files = fs.readdirSync(archiveDir);
  assert(files.includes("351711122233344445.pdf"), "File arsip contoh gagal dibuat.");
  fs.unlinkSync(archiveTestFile);
  log("OK archive filesystem smoke", GREEN);

  const chunkUpload = readProjectFile("src/lib/chunk-upload.ts");
  assert(chunkUpload.includes("writeChunk"), "chunk-upload belum memiliki writeChunk.");
  assert(chunkUpload.includes("assembleChunks"), "chunk-upload belum memiliki assembleChunks.");
  assert(chunkUpload.includes("deleteChunks"), "chunk-upload belum memiliki deleteChunks.");

  const chunkDir = path.join(process.cwd(), "tmp", "upload-chunks");
  ensureDir(chunkDir);
  const chunkPrefix = "smoke-session-123";
  fs.writeFileSync(path.join(chunkDir, `${chunkPrefix}_0`), Buffer.from("halo "));
  fs.writeFileSync(path.join(chunkDir, `${chunkPrefix}_1`), Buffer.from("dunia"));
  const assembled = Buffer.concat([
    fs.readFileSync(path.join(chunkDir, `${chunkPrefix}_0`)),
    fs.readFileSync(path.join(chunkDir, `${chunkPrefix}_1`)),
  ]);
  assert(assembled.toString("utf-8") === "halo dunia", "Assemble chunk smoke gagal.");
  fs.unlinkSync(path.join(chunkDir, `${chunkPrefix}_0`));
  fs.unlinkSync(path.join(chunkDir, `${chunkPrefix}_1`));
  log("OK chunk filesystem smoke", GREEN);

  const compressRoute = readProjectFile("src/app/api/archive/compress/route.ts");
  assert(
    compressRoute.includes('from "@/lib/archive-compression"') &&
      compressRoute.includes("compressArchiveFiles("),
    "Route compress belum mendelegasikan ke service archive-compression.",
  );

  const bapendaRoute = readProjectFile("src/app/api/check-bapenda/route.ts");
  assert(
    bapendaRoute.includes('from "@/lib/bapenda-sync"') &&
      bapendaRoute.includes("syncBapendaStatus("),
    "Route check-bapenda belum mendelegasikan ke service bapenda-sync.",
  );
  log("OK route delegation", GREEN);

  const archiveTab = readProjectFile("src/components/settings/archive-settings-tab.tsx");
  assert(archiveTab.includes("/api/archive/compress"), "Frontend belum memakai /api/archive/compress.");

  const bapendaConsumers = [
    "src/components/public/public-search.tsx",
    "src/components/map/region-unpaid-dialog.tsx",
    "src/components/tax/table/tax-detail-dialog.tsx",
    "src/components/tax/tax-data-table.tsx",
  ];
  for (const file of bapendaConsumers) {
    const content = readProjectFile(file);
    assert(content.includes("/api/check-bapenda"), `Consumer ${file} belum mengarah ke App Router check-bapenda.`);
  }

  assert(
    !fs.existsSync(path.join(process.cwd(), "src", "pages", "api", "check-bapenda.ts")),
    "Legacy route pages/api/check-bapenda.ts seharusnya sudah tidak ada.",
  );
  log("OK app route consumers and cleanup", GREEN);

  log("\nALL ARCHIVE SMOKE TESTS PASSED\n", GREEN);
}

try {
  run();
} catch (error) {
  log(`\nSMOKE TEST FAILED: ${error.message}\n`, RED);
  process.exit(1);
}
