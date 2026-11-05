import { create } from "zustand";
import type { SupportedChainId } from "@/lib/chains";
import { DEFAULT_CHAIN } from "@/lib/chains";

type UI = {
  connectOpen: boolean;
  setConnectOpen: (v: boolean) => void;
  /** App chain used while disconnected; when connected, the wallet chain wins. */
  appChainId: SupportedChainId;
  setAppChainId: (id: SupportedChainId) => void;
  /** Symbol picked from the Top tokens table into the swap card's "receive" field; `n` re-fires a repeat pick. */
  buyPick: { symbol: string; n: number } | null;
  pickBuy: (symbol: string | null) => void;
  quoting: boolean;
  setQuoting: (v: boolean) => void;
};

export const useUI = create<UI>((set) => ({
  connectOpen: false,
  setConnectOpen: (connectOpen) => set({ connectOpen }),
  appChainId: DEFAULT_CHAIN.id,
  setAppChainId: (appChainId) => set({ appChainId }),
  buyPick: null,
  pickBuy: (symbol) => set((s) => ({ buyPick: symbol ? { symbol, n: (s.buyPick?.n ?? 0) + 1 } : null })),
  quoting: false,
  setQuoting: (quoting) => set({ quoting }),
}));
