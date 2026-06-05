import { describe, it, expect } from "vitest";
import {
  assertSafeFilename,
  resolveSafeChildPath,
  assertSafeSessionId,
  assertValidImageUpload,
} from "@/lib/file-security";

describe("assertSafeFilename", () => {
  it("should accept valid filenames", () => {
    expect(assertSafeFilename("report.pdf")).toBe("report.pdf");
    expect(assertSafeFilename("data_2026.xlsx")).toBe("data_2026.xlsx");
  });

  it("should replace spaces with underscores", () => {
    expect(assertSafeFilename("my file.pdf")).toBe("my_file.pdf");
  });

  it("should reject path traversal in filename", () => {
    expect(() => assertSafeFilename("../etc/passwd")).toThrow();
    expect(() => assertSafeFilename("..\\windows\\system32")).toThrow();
  });

  it("should reject empty filename", () => {
    expect(() => assertSafeFilename("")).toThrow();
    expect(() => assertSafeFilename("   ")).toThrow();
  });

  it("should reject special characters", () => {
    expect(() => assertSafeFilename("file<name>.txt")).toThrow();
    expect(() => assertSafeFilename('file"name.txt')).toThrow();
    expect(() => assertSafeFilename("file|name.txt")).toThrow();
  });

  it("should reject dot and double-dot", () => {
    expect(() => assertSafeFilename(".")).toThrow();
    expect(() => assertSafeFilename("..")).toThrow();
  });
});

describe("resolveSafeChildPath", () => {
  // Use OS-native temp-like path for testing
  const baseDir = process.platform === "win32" ? "C:\\app\\uploads" : "/app/uploads";

  it("should resolve valid child paths", () => {
    const result = resolveSafeChildPath(baseDir, "file.pdf");
    expect(result).toContain("file.pdf");
    // Should start with the resolved base directory
    const path = require("path");
    expect(result.startsWith(path.resolve(baseDir))).toBe(true);
  });

  it("should sanitize path traversal with ../ by stripping leading segments", () => {
    // The function strips leading `../` and resolves safely under baseDir
    const result = resolveSafeChildPath(baseDir, "../../../etc/passwd");
    expect(result).toContain("etc");
    expect(result).toContain("passwd");
    // Must still resolve under baseDir
    const path = require("path");
    expect(result.startsWith(path.resolve(baseDir))).toBe(true);
  });

  it("should sanitize path traversal with ..\\\\ by stripping leading segments", () => {
    const result = resolveSafeChildPath(baseDir, "..\\..\\..\\windows\\system32");
    const path = require("path");
    expect(result.startsWith(path.resolve(baseDir))).toBe(true);
  });

  it("should reject absolute paths", () => {
    expect(() => resolveSafeChildPath(baseDir, "/etc/passwd")).toThrow();
  });

  it("should reject empty path", () => {
    expect(() => resolveSafeChildPath(baseDir, "")).toThrow();
    expect(() => resolveSafeChildPath(baseDir, "   ")).toThrow();
  });
});

describe("assertSafeSessionId", () => {
  it("should accept valid session IDs", () => {
    expect(assertSafeSessionId("abc123")).toBe("abc123");
    expect(assertSafeSessionId("session-id_test")).toBe("session-id_test");
  });

  it("should reject invalid characters", () => {
    expect(() => assertSafeSessionId("session/../../etc")).toThrow();
    expect(() => assertSafeSessionId("session<script>")).toThrow();
  });

  it("should reject empty session ID", () => {
    expect(() => assertSafeSessionId("")).toThrow();
  });

  it("should reject overly long session IDs", () => {
    const longId = "a".repeat(101);
    expect(() => assertSafeSessionId(longId)).toThrow();
  });
});

describe("assertValidImageUpload", () => {
  it("should accept valid JPEG magic bytes", () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(() => assertValidImageUpload(jpegBuffer, "image/jpeg")).not.toThrow();
  });

  it("should accept valid PNG magic bytes", () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(() => assertValidImageUpload(pngBuffer, "image/png")).not.toThrow();
  });

  it("should reject mismatched magic bytes", () => {
    const fakeJpeg = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    expect(() => assertValidImageUpload(fakeJpeg, "image/jpeg")).toThrow();
  });

  it("should reject unsupported MIME types", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff]);
    expect(() => assertValidImageUpload(buffer, "application/pdf")).toThrow();
  });

  it("should reject empty buffer", () => {
    expect(() => assertValidImageUpload(Buffer.alloc(0), "image/png")).toThrow();
  });
});
