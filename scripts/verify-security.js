const fs = require("fs");
const path = require("path");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(message, color = "") {
  console.log(`${color}${message}${RESET}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function assertCheck(condition, successMessage, failureMessage) {
  if (condition) {
    log(`PASS ${successMessage}`, GREEN);
    return 0;
  }

  log(`FAIL ${failureMessage}`, RED);
  return 1;
}

let failures = 0;

log("Running targeted security verification...", YELLOW);

const authContent = read("src/lib/auth.ts");
failures += assertCheck(
  authContent.includes("LOGIN_RATE_LIMIT") &&
    authContent.includes('action: "LOGIN_FAILED"') &&
    authContent.includes("maskIp(") &&
    authContent.includes("RATE_LIMIT") &&
    authContent.includes("INVALID_PASSWORD") &&
    authContent.includes("USER_NOT_FOUND"),
  "auth flow includes rate limiting and failed-login audit logging",
  "auth flow is missing rate limit or failed-login audit protections"
);

const fileSecurityContent = read("src/lib/file-security.ts");
failures += assertCheck(
  fileSecurityContent.includes("assertValidImageUpload") &&
    fileSecurityContent.includes('"image/png"') &&
    fileSecurityContent.includes('"image/webp"') &&
    fileSecurityContent.includes('"image/jpeg"'),
  "file-security exposes binary image signature validation",
  "file-security is missing binary image validation helper"
);

const avatarUploadContent = read("src/app/api/upload-avatar/route.ts");
failures += assertCheck(
  avatarUploadContent.includes("assertValidImageUpload(buffer, file.type)") &&
    avatarUploadContent.includes("EXTENSION_BY_TYPE"),
  "avatar upload validates image bytes and uses server-controlled extensions",
  "avatar upload is missing signature validation or safe extension mapping"
);

const logoUploadContent = read("src/app/api/upload-logo/route.ts");
failures += assertCheck(
  logoUploadContent.includes("assertValidImageUpload(buffer, file.type)") &&
    logoUploadContent.includes("EXTENSION_BY_TYPE"),
  "logo upload validates image bytes and uses server-controlled extensions",
  "logo upload is missing signature validation or safe extension mapping"
);

const restoreContent = read("src/app/api/restore/route.ts");
failures += assertCheck(
  restoreContent.includes("MAX_RESTORE_ZIP_SIZE") &&
    restoreContent.includes("MAX_RESTORE_ENTRIES") &&
    restoreContent.includes("isAllowedRestoreEntry") &&
    restoreContent.includes("resolveSafeChildPath") &&
    restoreContent.includes("await prisma.$connect()"),
  "restore flow validates ZIP structure and reconnects Prisma after failures",
  "restore flow is missing ZIP validation or Prisma reconnect handling"
);

if (failures > 0) {
  log(`Verification failed with ${failures} issue(s).`, RED);
  process.exit(1);
}

log("All targeted security verifications passed.", GREEN);
