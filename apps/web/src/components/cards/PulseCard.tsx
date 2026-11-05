"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Cloud, CloudLightning, CloudSun, Sun, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useConfig, useConnection } from "wagmi";
import { getGasPrice, getPublicClient, readContract } from "wagmi/actions";
import { estimateL1Fee } from "viem/op-stack";
import { arbitrum, base } from "viem/chains";
import { CHAIN_META, SUPPORTED_CHAINS, type SupportedChainId } from "@/lib/chains";
import { useActiveChain, useMounted, usePrices, useTokenBalances } from "@/lib/hooks";
import { TOKENS } from "@/lib/tokens";
import { useUI } from "@/stores/ui";

const SWAP_GAS = 150_000n;
const HIDDEN_KEY = "byzon:pulse-hidden";

type Slide = { id: string; title: React.ReactNode; sub: string; chip: string; body: React.ReactNode; cta: string; onCta: () => void; disabled?: boolean };

// shortcut: weather from absolute USD cost (not gwei vs 7-day median); refine in Phase 3.
// Typical Universal Router swap calldata size, used to price the L1 data fee on rollups.
const STUB_DATA = `0x${"ab".repeat(600)}` as const;
const STUB_TO = "0x0000000000000000000000000000000000000001" as const;
const ARB_NODE_INTERFACE = "0x00000000000000000000000000000000000000C8" as const;
const nodeInterfaceAbi = [
  {
    type: "function",
    name: "gasEstimateL1Component",
    stateMutability: "view", // really payable; declared view so it can be eth_call-ed
    inputs: [{ type: "address" }, { type: "bool" }, { type: "bytes" }],
    outputs: [{ type: "uint64" }, { type: "uint256" }, { type: "uint256" }],
  },
] as const;
const weather = (usd: number) =>
  usd < 0.05 ? { icon: Sun, label: "Clear skies" } : usd < 0.5 ? { icon: CloudSun, label: "Light clouds" } : usd < 3 ? { icon: Cloud, label: "Overcast" } : { icon: CloudLightning, label: "Stormy" };

function useGasWeather() {
  const config = useConfig();
  const ids = SUPPORTED_CHAINS.map((c) => TOKENS[c.id][0].priceId);
  const { data: prices } = usePrices(ids);
  const { data: gas } = useQuery({
    queryKey: ["gas-all"],
    queryFn: async () => {
      // L1 data fee (wei) for one swap on rollups; 0 on L1s or when the estimate fails.
      const l1Fee = async (id: SupportedChainId): Promise<bigint> => {
        try {
          if (id === base.id) return await estimateL1Fee(getPublicClient(config, { chainId: id })!, { chain: base, account: STUB_TO, to: STUB_TO, data: STUB_DATA });
          if (id === arbitrum.id) {
            const [l1Gas, baseFee] = await readContract(config, { chainId: id, address: ARB_NODE_INTERFACE, abi: nodeInterfaceAbi, functionName: "gasEstimateL1Component", args: [STUB_TO, false, STUB_DATA] });
            return BigInt(l1Gas) * baseFee;
          }
        } catch {}
        return 0n;
      };
      return Object.fromEntries(
        await Promise.all(
          SUPPORTED_CHAINS.map(async (c) => {
            const [wei, l1] = await Promise.all([getGasPrice(config, { chainId: c.id }).catch(() => undefined), l1Fee(c.id)]);
            return [c.id, wei === undefined ? undefined : wei * SWAP_GAS + l1] as const;
          }),
        ),
      ) as Record<SupportedChainId, bigint | undefined>;
    },
    refetchInterval: 30_000,
  });
  return SUPPORTED_CHAINS.map((c) => {
    const wei = gas?.[c.id];
    const px = prices?.[TOKENS[c.id][0].priceId]?.price;
    return { id: c.id, usd: wei !== undefined && px ? (Number(wei) / 1e18) * px : undefined };
  });
}

function readHidden(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function PulseCard() {
  const mounted = useMounted();
  const { address } = useConnection();
  const connected = mounted && !!address;
  const setConnectOpen = useUI((s) => s.setConnectOpen);
  const { chainId, select } = useActiveChain();
  const gas = useGasWeather();
  const { balances } = useTokenBalances(chainId);
  const { data: prices } = usePrices(TOKENS[chainId].map((t) => t.priceId));
  // shortcut: dust is counted on the active chain only; scan all chains once ByzonRouter.sweep ships.
  const dust = TOKENS[chainId]
    .filter((t) => t.address !== "native") // never sweep the gas token
    .map((t) => (balances[t.symbol] ?? 0) * (prices?.[t.priceId]?.price ?? 0))
    .filter((usd) => usd > 0 && usd < 10);
  const dustUsd = dust.reduce((a, b) => a + b, 0);
  const [hiddenState, setHidden] = useState<string[] | null>(null);
  const hidden = useMemo(() => (mounted ? (hiddenState ?? readHidden()) : []), [mounted, hiddenState]);
  const [i, setI] = useState(0);

  const cheapest = gas.filter((g) => g.usd !== undefined).sort((a, b) => a.usd! - b.usd!)[0];

  const slides = useMemo<Slide[]>(() => {
    const all: (Slide & { show: boolean })[] = [
      {
        id: "welcome",
        show: !connected,
        title: "Swap smarter with",
        sub: "Best Uniswap routes on 4 chains.",
        chip: "0.05%",
        body: "Fees start at 0.05% for stablecoin pairs and wraps are free. Byzon never holds your funds: every swap is signed in your wallet.",
        cta: "Connect wallet",
        onCta: () => setConnectOpen(true),
      },
      {
        id: "gas",
        show: true,
        title: "Gas weather, cheapest",
        sub: "Estimated cost of one swap, right now.",
        chip: cheapest?.usd !== undefined ? `$${cheapest.usd < 0.01 ? "0.01" : cheapest.usd.toFixed(2)}` : "…",
        body: (
          <ul className="space-y-1.5">
            {gas.map((g) => {
              const w = g.usd !== undefined ? weather(g.usd) : null;
              const Icon = w?.icon ?? Cloud;
              return (
                <li key={g.id} className="flex items-center gap-2">
                  <Icon className="size-3.5 text-t2" strokeWidth={1.75} />
                  <span className="text-t1">{CHAIN_META[g.id].name}</span>
                  <span className="text-t3">{w?.label ?? "…"}</span>
                  <span className="num ml-auto text-t2">{g.usd !== undefined ? `≈ $${g.usd < 0.01 ? "<0.01" : g.usd.toFixed(2)}` : ""}</span>
                </li>
              );
            })}
          </ul>
        ),
        cta: cheapest ? `Swap on ${CHAIN_META[cheapest.id].name}` : "Swap",
        onCta: () => cheapest && select(cheapest.id),
      },
      {
        id: "dust",
        show: connected && dust.length >= 3,
        title: "Sweep your dust",
        sub: `${dust.length} small balances on ${CHAIN_META[chainId].name}.`,
        chip: `$${dustUsd.toFixed(2)}`,
        body: `You have ${dust.length} dust tokens worth $${dustUsd.toFixed(2)}. Sweep them into one token in one transaction.`,
        cta: "Coming soon",
        onCta: () => {},
        disabled: true, // needs ByzonRouter.sweep deployed
      },
      {
        id: "autopilot",
        show: connected,
        title: "Let's go Autopilot",
        sub: "DCA, limits and stop-loss, on-chain.",
        chip: "DCA",
        body: "Buy ETH every week automatically, or protect a position with a stop-loss. Funds stay in your wallet until each order fires.",
        cta: "Set it up",
        onCta: () => {},
      },
    ];
    return all.filter((s) => s.show && !hidden.includes(s.id));
  }, [connected, gas, cheapest, hidden, setConnectOpen, select, chainId, dust.length, dustUsd]);

  const s = slides[i % Math.max(1, slides.length)];

  return (
    <aside aria-label="Byzon Pulse" className="card relative flex min-h-[420px] flex-col overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_100%_100%,rgba(217,162,30,.16),transparent_70%)]" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-sm font-medium">Pulse</div>
          <div className="text-xs text-t3">
            Powered by <span className="text-t2">Byzon</span>
          </div>
        </div>
        {slides.length > 1 && (
          <button onClick={() => setI((i + 1) % slides.length)} className="flex items-center gap-1.5 text-sm font-medium">
            Next <ArrowRight className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {s ? (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-6 flex flex-1 flex-col"
          >
            <div className="rounded-[12px] bg-gradient-to-b from-white/[0.14] to-white/[0.06] py-2.5 text-center text-sm text-t2 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
              Just for today!
            </div>
            <div className="mt-7 flex items-center gap-2.5">
              <Zap className="size-4 shrink-0 fill-white" />
              <span className="text-[17px] font-medium leading-tight">{s.title}</span>
              <span className="gold-chip num shrink-0 rounded-[8px] px-2 py-0.5 text-[15px] font-bold">{s.chip}</span>
            </div>
            <p className="ml-6.5 mt-1 text-[13px] text-t2">{s.sub}</p>
            <div className="mt-6 text-[13px] leading-relaxed text-t2">{s.body}</div>
            <div className="mt-auto border-t border-line pt-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const next = [...hidden, s.id];
                    setHidden(next);
                    try {
                      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
                    } catch {}
                  }}
                  className="text-sm text-t3 hover:text-t2"
                >
                  Don&apos;t show again
                </button>
                <button onClick={s.onCta} disabled={s.disabled} title={s.disabled ? "Sweep to USDC ships with the Byzon router" : undefined} className="pill-white px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {s.cta}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative m-auto text-sm text-t3">
            You&apos;re all caught up.
          </motion.p>
        )}
      </AnimatePresence>
    </aside>
  );
}
