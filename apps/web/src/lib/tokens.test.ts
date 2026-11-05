import { expect, test } from "vitest";
import { findOnChain, TOKENS, TOP_TOKENS } from "./tokens";

test("findOnChain maps BTC to the wrapped token and misses absent tokens", () => {
  expect(findOnChain("BTC", TOKENS[137])?.symbol).toBe("WBTC");
  expect(findOnChain("ARB", TOKENS[8453])).toBeUndefined();
});

test("TOP_TOKENS networks match swappable chains", () => {
  for (const t of TOP_TOKENS) for (const c of t.chains) expect(findOnChain(t.symbol, TOKENS[c as keyof typeof TOKENS])).toBeDefined();
});
