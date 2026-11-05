import { parseUnits } from "viem";

/** Byzon fee schedule (SPEC §7.4), in basis points. Must match ByzonRouter on-chain. */
export const FEE_BPS = { standard: 20, stable: 5, wrap: 0 } as const;
const STABLES = new Set(["USDC", "USDT", "DAI"]);
const WRAPS: Record<string, string> = { ETH: "WETH", WETH: "ETH", POL: "WPOL", WPOL: "POL" };

export function feeBps(sell: string, buy: string): number {
  if (WRAPS[sell] === buy) return FEE_BPS.wrap;
  if (STABLES.has(sell) && STABLES.has(buy)) return FEE_BPS.stable;
  return FEE_BPS.standard;
}

export type ButtonState =
  | { label: string; action: "connect" | "switch" | "none"; disabled: boolean };

/** Single source of truth for the swap CTA (SPEC §3.4 step 2). Quote/approve states land in Phase 2. */
export function swapButton(s: {
  connected: boolean;
  wrongNetwork: boolean;
  amount: string;
  decimals: number;
  /** Exact on-chain balance in base units. */
  balance?: bigint;
  sell: string;
  buy: string;
  liveRouting: boolean;
}): ButtonState {
  if (!s.connected) return { label: "Connect wallet", action: "connect", disabled: false };
  if (s.wrongNetwork) return { label: "Switch network", action: "switch", disabled: false };
  if (s.sell === s.buy) return { label: "Select a different token", action: "none", disabled: true };
  let wei = 0n;
  try {
    wei = parseUnits(s.amount, s.decimals);
  } catch {}
  if (wei <= 0n) return { label: "Enter an amount", action: "none", disabled: true };
  if (s.balance !== undefined && wei > s.balance) return { label: `Insufficient ${s.sell} balance`, action: "none", disabled: true };
  if (!s.liveRouting) return { label: "Swaps open soon", action: "none", disabled: true };
  return { label: "Review swap", action: "none", disabled: false };
}
