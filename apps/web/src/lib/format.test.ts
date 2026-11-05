import { describe, expect, it } from "vitest";
import { formatAmount, formatCompactUsd, formatPct, formatUsd, shortAddress, toInput } from "./format";

describe("format", () => {
  it("formats usd with adaptive precision", () => {
    expect(formatUsd(23094.567)).toBe("23,094.57");
    expect(formatUsd(0.5)).toBe("0.50");
    expect(formatUsd(0.000123)).toBe("0.000123");
    expect(formatUsd(undefined)).toBe("—");
    expect(formatUsd(1_250_000, { compact: true })).toBe("1.25M");
  });
  it("formats token amounts", () => {
    expect(formatAmount(0)).toBe("0");
    expect(formatAmount(1.204)).toBe("1.204");
    expect(formatAmount(0.0000001)).toBe("<0.000001");
  });
  it("formats pct and addresses", () => {
    expect(formatPct(-37.164)).toBe("37.16");
    expect(shortAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
  });
});

describe("toInput", () => {
  it("never emits exponents and respects token decimals", () => {
    expect(toInput(1.5e-7, 18)).toBe("0.00000015");
    expect(toInput(1.23456789e-7, 6)).toBe("0");
    expect(toInput(12345.678912, 6)).toBe("12345.679");
    expect(toInput(2e21, 18)).toBe("2000000000000000000000");
  });
});

it("formatCompactUsd", () => {
  expect(formatCompactUsd(1_234_000_000)).toBe("$1.2B");
  expect(formatCompactUsd(undefined)).toBe("—");
});
