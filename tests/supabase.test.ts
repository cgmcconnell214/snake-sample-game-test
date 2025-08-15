import { describe, it, expect } from "vitest";
import { generateXrplCurrencyCode } from "../supabase/functions/utils";

describe("generateXrplCurrencyCode", () => {
  it("pads short symbols to three chars", () => {
    expect(generateXrplCurrencyCode("USD")).toBe("USD");
    expect(generateXrplCurrencyCode("US")).toBe("US\0");
  });

  it("creates hex code for long symbols", () => {
    const code = generateXrplCurrencyCode("LONGTOKEN");
    expect(code.length).toBe(40);
    expect(code).toMatch(/^[0-9A-F]+$/);
    // Verify specific encoding matches TextEncoder output
    const expectedBytes = new TextEncoder().encode("LONGTOKEN");
    const expectedHex = Array.from(expectedBytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    expect(code).toBe(expectedHex.padEnd(40, "0"));
  });
});
