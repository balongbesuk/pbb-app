import { describe, it, expect } from "vitest";
import { maskNop } from "@/lib/pin-verification";

describe("maskNop", () => {
  it("should mask 18-digit NOP correctly", () => {
    const result = maskNop("351706000801700320");
    expect(result).toBe("35.17.060.008.017-XXXX.X");
  });

  it("should mask NOP with dots/dashes format", () => {
    const result = maskNop("35.17.060.008.017-0032.0");
    // After removing non-digits, it should be 18 chars
    expect(result).toBe("35.17.060.008.017-XXXX.X");
  });

  it("should mask NOP with dash separator", () => {
    const result = maskNop("35170600801700-32.0");
    // Contains dash, uses dash-based masking
    expect(result).toContain("-XXXX.X");
  });

  it("should mask short NOP by replacing last 5 chars", () => {
    const result = maskNop("12345678");
    expect(result).toBe("123XXXXX");
  });

  it("should handle empty string", () => {
    const result = maskNop("");
    expect(result).toBe("XXXXX");
  });
});
