import fs from "fs";
import path from "path";

/**
 * DEPRECATED:
 * Script ini dibuat untuk arsitektur lama saat alur arsip masih tersebar di Pages Router.
 * Gunakan `npm run smoke:archive` untuk smoke test arsip terbaru.
 *
 * Security & Integrity Smoke Test for PBB Manager v6.0
 * 📋 Melakukan pengecekan otomatis pada endpoint sensitif untuk:
 * 1. Proteksi Autentikasi & Role
 * 2. Konsistensi Path Penyimpanan (Storage vs Public)
 * 3. Penanganan Error pada Restore
 */

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(msg: string, color = "") {
  console.log(`${color}${msg}${RESET}`);
}

const FILES_TO_CHECK = {
  pagesApi: [
    "src/pages/api/backup-archive.ts",
    "src/pages/api/compress-archives-api.ts",
    "src/pages/api/restore-archive.ts",
    "src/pages/api/smart-scan.ts",
    "src/pages/api/upload-chunk.ts",
  ],
  appApi: [
    "src/app/api/archive-upload/route.ts",
    "src/app/api/restore/route.ts",
    "src/app/api/backup/route.ts",
    "src/app/api/download-template/route.ts",
  ],
};

async function runSecurityAudit() {
  log("\n🛡️  STARTING SECURITY SMOKE TEST...\n", YELLOW);

  let totalErrors = 0;

  // --- 1. Role & Auth Protection Check ---
  log("🔍 Checking Auth & Role Protection (ADMIN required)...");
  const allApiFiles = [...FILES_TO_CHECK.pagesApi, ...FILES_TO_CHECK.appApi];

  for (const file of allApiFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      log(`⚠️  File not found: ${file}`, YELLOW);
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    const hasAuthCheck = content.includes("getServerSession");
    const hasAdminCheck = content.includes('role !== "ADMIN"') || content.includes('role !== \'ADMIN\'') || content.includes('.role === "ADMIN"');
    
    // Special exception for download-template which only needs log in (not strict ADMIN)
    if (file.includes("download-template")) {
        if (hasAuthCheck) {
            log(`✅ [AUTH] ${file} is protected.`, GREEN);
        } else {
            log(`❌ [AUTH] ${file} is MISSING protection!`, RED);
            totalErrors++;
        }
        continue;
    }

    if (hasAuthCheck && hasAdminCheck) {
      log(`✅ [ROLE] ${file} is protected with ADMIN role.`, GREEN);
    } else {
      log(`❌ [ROLE] ${file} is MISSING authentication or ADMIN role check!`, RED);
      totalErrors++;
    }
  }

  // --- 2. Path Consistency Check (Storage vs Public) ---
  log("\n📂 Checking Storage Path Consistency...");
  const storageCheckFiles = [
    "src/pages/api/smart-scan.ts",
    "src/pages/api/compress-archives-api.ts",
    "src/app/api/archive-upload/route.ts",
    "src/app/actions/settings-actions.ts",
    "src/app/actions/public-actions.ts"
  ];

  for (const file of storageCheckFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf-8");
    const hasPublicArsip = content.includes('"public", "arsip-pbb"') || content.includes("'public', 'arsip-pbb'");
    
    if (!hasPublicArsip) {
      log(`✅ [PATH] ${file} correctly uses private storage for archives.`, GREEN);
    } else {
      log(`❌ [PATH] ${file} STILL points to public/arsip-pbb!`, RED);
      totalErrors++;
    }
  }

  // --- 3. Restore Failure Handling Check ---
  log("\n📦 Checking Restore Error Handling...");
  const restoreFile = path.join(process.cwd(), "src/app/api/restore/route.ts");
  if (fs.existsSync(restoreFile)) {
    const content = fs.readFileSync(restoreFile, "utf-8");
    const hasZipCheck = content.includes("AdmZip") && content.includes("catch");
    const hasDbCheck = content.includes("dbEntry");
    
    if (hasZipCheck && hasDbCheck) {
      log("✅ [RESTORE] Valid ZIP and DB entry checks found.", GREEN);
    } else {
      log("❌ [RESTORE] Missing ZIP validation or DB entry checks!", RED);
      totalErrors++;
    }
  }

  // --- 4. Fallback Password Check ---
  log("\n🔐 Checking for Hardcoded Passwords...");
  const devEnvExamplePath = path.join(process.cwd(), ".env.example");
  const seedPath = path.join(process.cwd(), "prisma/seed.ts");
  
  if (fs.existsSync(seedPath)) {
      const seedContent = fs.readFileSync(seedPath, "utf-8");
      if (seedContent.includes('bcrypt.hash("admin123", 10)') || seedContent.includes('bcrypt.hash(\'admin123\', 10)')) {
          log("❌ [SECRET] Hardcoded admin password found in prisma/seed.ts!", RED);
          totalErrors++;
      } else {
          log("✅ [SECRET] No hardcoded passwords in seed script.", GREEN);
      }
  }

  log("\n🎯 Checking Administrative Role Enforcement...");
  const adminAssignFile = path.join(process.cwd(), "src/app/actions/tax-assign-actions.ts");
  if (fs.existsSync(adminAssignFile)) {
    const content = fs.readFileSync(adminAssignFile, "utf-8");
    const hasRoleCheck = content.includes('role !== "PENARIK"') || content.includes('role !== \'PENARIK\'');
    
    if (hasRoleCheck) {
      log("✅ [ADMIN] Admin-to-User assignment is restricted to PENARIK only.", GREEN);
    } else {
      log("❌ [ADMIN] Admin assignment is MISSING PENARIK role check!", RED);
      totalErrors++;
    }
  }

  // --- FINISH ---
  log("\n-------------------------------------------");
  if (totalErrors === 0) {
    log("🎉 ALL SMOKE TESTS PASSED! SYSTEM IS SECURE.", GREEN);
    process.exit(0);
  } else {
    log(`🚨 SYSTEM INSECURE: ${totalErrors} issue(s) found!`, RED);
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
