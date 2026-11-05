"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpDown, ChevronDown, CircleHelp, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { CHAIN_META } from "@/lib/chains";
import { formatAmount, formatUsd, toInput } from "@/lib/format";
import { useActiveChain, useIsConnected, useMounted, usePrices, useTokenBalances } from "@/lib/hooks";
import { feeBps, swapButton } from "@/lib/swap";
import { findOnChain, tokenLogo, TOKENS, type Token } from "@/lib/tokens";
import { useUI } from "@/stores/ui";
import { TokenBadge } from "@/components/ui/primitives";

const Orb = dynamic(() => import("@/components/three/Orb"), {
  ssr: false,
  loading: () => <div className="absolute inset-x-0 bottom-[-40%] mx-auto size-[260px] rounded-full bg-[radial-gradient(circle,#1d4fe6_0%,#0a1a4a_60%,transparent_70%)] opacity-70" />,
});

// shortcut: indicative output from spot prices until /api/quote (Uniswap Trading API) lands in Phase 2.
const LIVE_ROUTING = false;


export function SwapCard() {
  const mounted = useMounted();
  const connected = useIsConnected();
  const { chainId, wrongNetwork, select } = useActiveChain();
  const tokens = TOKENS[chainId];
  const [sellSym, setSellSym] = useState(tokens[0].symbol);
  const [buySym, setBuySym] = useState(tokens[1].symbol);
  const [amount, setAmount] = useState("");
  const setConnectOpen = useUI((s) => s.setConnectOpen);
  const setQuoting = useUI((s) => s.setQuoting);
  const quoting = useUI((s) => s.quoting);
  const pick = useUI((s) => s.buyPick);

  // Reset to sensible defaults when the chain changes and the pair is not on it.
  const sell = tokens.find((t) => t.symbol === sellSym) ?? tokens[0];
  const buy = tokens.find((t) => t.symbol === buySym) ?? tokens[1];
  const [lastPick, setLastPick] = useState(pick);
  if (pick !== lastPick) {
    setLastPick(pick);
    const match = pick && findOnChain(pick.symbol, tokens);
    if (match && match.symbol !== sell.symbol) setBuySym(match.symbol);
  }

  const { data: prices } = usePrices(tokens.map((t) => t.priceId));
  const { balances, raw } = useTokenBalances(chainId);
  const amt = Number(amount) || 0;
  const pIn = prices?.[sell.priceId]?.price;
  const pOut = prices?.[buy.priceId]?.price;
  const bps = feeBps(sell.symbol, buy.symbol);
  const out = pIn && pOut ? (amt * (1 - bps / 10_000) * pIn) / pOut : undefined;

  // Orb spins up briefly on every edit (stands in for the quote round-trip until Phase 2).
  useEffect(() => {
    if (!amt) return;
    setQuoting(true);
    const t = setTimeout(() => setQuoting(false), 900);
    return () => {
      clearTimeout(t);
      setQuoting(false);
    };
  }, [amt, sell.symbol, buy.symbol, setQuoting]);

  const btn = swapButton({
    connected,
    wrongNetwork,
    amount,
    decimals: sell.decimals,
    balance: connected ? raw[sell.symbol] : undefined,
    sell: sell.symbol,
    buy: buy.symbol,
    liveRouting: LIVE_ROUTING,
  });

  const flip = () => {
    setSellSym(buy.symbol);
    setBuySym(sell.symbol);
    if (out) setAmount(toInput(out, buy.decimals));
  };

  return (
    <section aria-labelledby="swap-title" className="flex min-w-0 flex-1 flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="swap-title" className="text-[22px] font-semibold tracking-tight">Swap</h2>
          <p className="mt-0.5 text-sm text-t3">
            Best price across <span className="text-t2">Uniswap</span> pools on {CHAIN_META[chainId].name}
          </p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-[12px] border border-line bg-s3 px-3.5 text-sm" aria-label="Slippage settings">
          Slippage 0.5% <ChevronDown className="size-4 text-t2" strokeWidth={1.75} />
        </button>
      </div>

      <div className="card-glass flex flex-1 flex-col p-5">
        {/* You pay */}
        <div className="relative">
          <div className="flex items-center justify-between text-sm text-t3">
            <span>You pay</span>
            {connected && raw[sell.symbol] !== undefined && (
              <button onClick={() => setAmount(formatUnits(raw[sell.symbol], sell.decimals))} className="num hover:text-white">
                Balance {formatAmount(balances[sell.symbol])} <span className="ml-1 font-medium text-accent">MAX</span>
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <input
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                if (new RegExp(`^\\d*\\.?\\d{0,${sell.decimals}}$`).test(v)) setAmount(v);
              }}
              aria-label={`Amount of ${sell.symbol} to pay`}
              className="num min-w-0 flex-1 bg-transparent text-[40px] font-medium leading-none tracking-tight outline-none placeholder:text-t3"
            />
            <TokenPicker chainId={chainId} token={sell} tokens={tokens} balances={balances} onPick={(t) => (t.symbol === buy.symbol ? flip() : setSellSym(t.symbol))} />
          </div>
          <p className="num mt-2 text-sm text-t3">≈ <span className="text-accent">$</span> {formatUsd(pIn !== undefined ? amt * pIn : undefined)}</p>
        </div>

        <div className="relative my-3 h-px bg-line">
          <button
            onClick={flip}
            aria-label="Flip tokens"
            className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-s3 text-t2 transition-transform hover:rotate-180 hover:text-white"
          >
            <ArrowUpDown className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* You receive */}
        <div>
          <div className="text-sm text-t3">You receive</div>
          <div className="mt-1 flex items-center gap-3">
            <span className={`num min-w-0 flex-1 truncate text-[28px] font-medium leading-none tracking-tight ${out ? "" : "text-t3"}`}>
              {out ? formatAmount(out) : "0"}
            </span>
            <TokenPicker chainId={chainId} token={buy} tokens={tokens} balances={balances} onPick={(t) => (t.symbol === sell.symbol ? flip() : setBuySym(t.symbol))} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-t3">
            <span className="num">≈ $ {formatUsd(out !== undefined && pOut ? out * pOut : undefined)}</span>
            <span className="flex items-center gap-1">
              <CircleHelp className="size-3.5" strokeWidth={1.75} /> Byzon fee {(bps / 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Route Assistant (orb panel) */}
        <div className="relative mt-4 h-[220px] overflow-hidden rounded-[16px] border border-line bg-[radial-gradient(120%_90%_at_50%_100%,#14307a_0%,#0b1636_45%,#070b18_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />
          <div className="relative z-10 pt-4 text-center">
            <div className="text-[15px] font-medium">Route Assistant</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={quoting ? "q" : out ? "r" : "i"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1 flex items-center justify-center gap-2 px-4 text-sm text-t2"
              >
                {quoting ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" /> is finding the best route now…
                  </>
                ) : out ? (
                  <span className="num">
                    1 {sell.symbol} = {formatAmount(out / amt)} {buy.symbol} · indicative
                  </span>
                ) : (
                  "Enter an amount to see the best route"
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="absolute inset-x-0 bottom-[-30%] top-[22%]">{mounted && <Orb />}</div>
        </div>

        <button
          disabled={btn.disabled}
          onClick={() => (btn.action === "connect" ? setConnectOpen(true) : btn.action === "switch" ? select(chainId) : undefined)}
          className="pill-white mt-4 h-12 w-full text-[15px] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-t2"
        >
          {mounted ? btn.label : "Connect wallet"}
        </button>
      </div>
    </section>
  );
}

function TokenPicker({ token, tokens, balances, onPick, chainId }: { token: Token; tokens: Token[]; balances: Record<string, number>; onPick: (t: Token) => void; chainId: number }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(
    () =>
      tokens
        .filter((t) => `${t.symbol} ${t.name} ${t.address}`.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => (balances[b.symbol] ?? 0) - (balances[a.symbol] ?? 0)),
    [tokens, q, balances],
  );
  return (
    <Dialog.Root open={open} onOpenChange={(o) => (setOpen(o), setQ(""))}>
      <Dialog.Trigger className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-s3 pl-1.5 pr-3 text-sm font-medium hover:bg-s4">
        <TokenBadge symbol={token.symbol} color={token.color} size={28} src={tokenLogo(chainId, token)} />
        {token.symbol}
        <ChevronDown className="size-4 text-t2" strokeWidth={1.75} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="card-glass fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 p-4">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold">Select a token</Dialog.Title>
            <Dialog.Close aria-label="Close" className="grid size-8 place-items-center rounded-full text-t2 hover:bg-white/5">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Search by symbol, name or address</Dialog.Description>
          <label className="mt-3 flex h-11 items-center gap-2 rounded-[12px] border border-line bg-black/30 px-3">
            <Search className="size-4 text-t3" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Symbol, name or address" className="flex-1 bg-transparent text-sm outline-none placeholder:text-t3" />
          </label>
          <ul className="scroll-thin mt-3 max-h-[320px] overflow-y-auto">
            {list.map((t) => (
              <li key={t.symbol}>
                <button
                  onClick={() => (onPick(t), setOpen(false))}
                  className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2.5 text-left hover:bg-white/5 data-[on=true]:bg-white/5"
                  data-on={t.symbol === token.symbol}
                >
                  <TokenBadge symbol={t.symbol} color={t.color} size={32} src={tokenLogo(chainId, t)} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{t.symbol}</span>
                    <span className="block text-xs text-t3">{t.name}</span>
                  </span>
                  {balances[t.symbol] !== undefined && <span className="num text-sm text-t2">{formatAmount(balances[t.symbol])}</span>}
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="py-6 text-center text-sm text-t3">No tokens match. Custom imports arrive with live routing.</li>}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
