import { describe, it, expect } from "vitest";
import { esc, digits, text, formDate, splitDate, cells, opt, label, bar } from "@/lib/spop-print-helpers";

describe("SPOP Print Helpers", () => {
  describe("esc", () => {
    it("should escape HTML entities", () => {
      expect(esc("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
      );
    });

    it("should escape ampersand", () => {
      expect(esc("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    it("should escape quotes", () => {
      expect(esc('"hello"')).toBe("&quot;hello&quot;");
    });

    it("should handle empty string", () => {
      expect(esc("")).toBe("");
    });
  });

  describe("digits", () => {
    it("should extract only digits", () => {
      expect(digits("35.17.060.008")).toBe("3517060008");
    });

    it("should return empty for non-digit string", () => {
      expect(digits("abc")).toBe("");
    });

    it("should handle empty string", () => {
      expect(digits("")).toBe("");
    });
  });

  describe("text", () => {
    it("should uppercase and trim", () => {
      expect(text("  hello world  ")).toBe("HELLO WORLD");
    });

    it("should collapse multiple spaces", () => {
      expect(text("hello   world")).toBe("HELLO WORLD");
    });

    it("should remove control characters", () => {
      expect(text("hello\x00world")).toBe("HELLOWORLD");
    });
  });

  describe("formDate", () => {
    it("should format date as DDMMYYYY", () => {
      expect(formDate("2026-01-15")).toBe("15012026");
    });

    it("should return empty for invalid date", () => {
      expect(formDate("not-a-date")).toBe("");
    });

    it("should return empty for empty string", () => {
      expect(formDate("")).toBe("");
    });
  });

  describe("splitDate", () => {
    it("should split date into [DD, MM, YYYY]", () => {
      expect(splitDate("2026-03-22")).toEqual(["22", "03", "2026"]);
    });

    it("should return empty array elements for invalid date", () => {
      expect(splitDate("")).toEqual(["", "", ""]);
    });
  });

  describe("cells", () => {
    it("should render correct number of cell spans", () => {
      const result = cells("AB", 3);
      expect(result).toContain("cell");
      // Should have 3 cells (A, B, &nbsp;)
      const cellCount = (result.match(/class="cell"/g) || []).length;
      expect(cellCount).toBe(3);
    });

    it("should pad right by default", () => {
      const result = cells("A", 2);
      expect(result).toContain(">A<");
    });
  });

  describe("opt", () => {
    it("should render checked option", () => {
      const result = opt("1", "Pemilik", true);
      expect(result).toContain("X");
      expect(result).toContain("Pemilik");
    });

    it("should render unchecked option", () => {
      const result = opt("1", "Pemilik", false);
      expect(result).not.toContain(">X<");
    });
  });

  describe("label", () => {
    it("should render numbered label", () => {
      const result = label("1", "NOP");
      expect(result).toContain("1.");
      expect(result).toContain("NOP");
    });
  });

  describe("bar", () => {
    it("should render section bar", () => {
      const result = bar("A", "DATA TANAH");
      expect(result).toContain("A. DATA TANAH");
    });
  });
});
