"use client";

import { ArrowLeft, ArrowRight, MoreVertical, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useConnection } from "wagmi";
import { formatAmount, formatUsd } from "@/lib/format";
import { useActiveChain, useMounted, usePrices, useTokenBalances } from "@/lib/hooks";
import { tokenLogo, TOKENS } from "@/lib/tokens";
import { useUI } from "@/stores/ui";
import { Delta, TokenBadge } from "@/components/ui/primitives";

export function Holdings() {
  const mounted = useMounted();
  const { address } = useConnection();
  const { chainId } = useActiveChain();
  const tokens = TOKENS[chainId];
  const { balances } = useTokenBalances(chainId);
  const { data: prices } = usePrices(tokens.map((t) => t.priceId));
  const setBuy = useUI((s) => s.pickBuy);
  const setConnectOpen = useUI((s) => s.setConnectOpen);
  const [page, setPage] = useState(0);

  const rows = tokens
    .map((t) => ({ t, bal: balances[t.symbol] ?? 0, px: prices?.[t.priceId] }))
    .map((r) => ({ ...r, usd: r.px ? r.bal * r.px.price : 0 }))
    .filter((r) => r.bal > 0)
    .sort((a, b) => b.usd - a.usd);
  const pages = Math.max(1, Math.ceil(rows.length / 2));
  const p = Math.min(page, pages - 1);
  const connected = mounted && !!address;

  return (
    <section aria-labelledby="holdings-title" className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 id="holdings-title" className="text-[17px] font-medium">My top holdings</h3>
        {connected && rows.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-t3">
            <span className="num">
              {String(p + 1).padStart(2, "0")} of {pages}
            </span>
            <button aria-label="Previous holdings" disabled={p === 0} onClick={() => setPage(p - 1)} className="grid size-8 place-items-center rounded-[10px] bg-s4 text-white disabled:opacity-40">
              <ArrowLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button aria-label="Next holdings" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="grid size-8 place-items-center rounded-[10px] bg-s4 text-white disabled:opacity-40">
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {!connected ? (
        <div className="flex items-center justify-between gap-3 rounded-[16px] border border-dashed border-line-strong p-4">
          <p className="text-sm text-t2">Connect a wallet to see your balances on every chain.</p>
          <button onClick={() => setConnectOpen(true)} className="pill-white shrink-0 px-4 py-2 text-sm">
            Connect
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-[16px] border border-dashed border-line-strong p-4 text-sm text-t2">No balances on this network yet.</p>
      ) : (
        <div className="relative grid grid-cols-2 gap-3 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {rows.slice(p * 2, p * 2 + 2).map((r, i) => (
              <motion.article
                key={r.t.symbol}
                initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -24, filter: "blur(6px)" }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-[16px] border border-line bg-s3 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <TokenBadge symbol={r.t.symbol} color={r.t.color} size={18} src={tokenLogo(chainId, r.t)} />
                    {r.t.symbol}
                  </span>
                  <MoreVertical className="size-4 text-t3" />
                </div>
                <div className="num mt-2 text-[15px] font-medium">
                  <span className="text-t3">$</span> {formatUsd(r.usd)}
                </div>
                <div className="num text-xs text-t3">{formatAmount(r.bal)} {r.t.symbol}</div>
                <div className="mt-2 flex items-center justify-between">
                  <Delta value={r.px?.change24h} className="text-xs" />
                  <button onClick={() => setBuy(r.t.symbol)} aria-label={`Swap into ${r.t.symbol}`} className="grid size-8 place-items-center rounded-full bg-white text-black">
                    <Plus className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
