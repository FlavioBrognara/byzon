"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { useActiveChain, useChart, useMarkets, usePrices } from "@/lib/hooks";
import { CHAIN_META } from "@/lib/chains";
import { formatCompactUsd, formatUsd } from "@/lib/format";
import { findOnChain, TOKENS, TOP_TOKENS } from "@/lib/tokens";
import type { SupportedChainId } from "@/lib/chains";
import { useUI } from "@/stores/ui";
import { ChainDot, Delta, Sparkline, TokenBadge } from "@/components/ui/primitives";

const IDS = TOP_TOKENS.map((t) => t.priceId);

export function TopTokens() {
  const { data: prices } = usePrices(IDS);
  const { data: charts } = useChart(IDS, "week");
  const { data: markets } = useMarkets(IDS);
  const { chainId } = useActiveChain();
  const selected = useUI((s) => s.buyPick?.symbol);
  const setBuy = useUI((s) => s.pickBuy);

  return (
    <section aria-labelledby="top-title" className="card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 id="top-title" className="text-[17px] font-medium">Top tokens</h3>
        <button className="flex h-10 items-center gap-2 rounded-[12px] bg-s3 pl-1.5 pr-3 text-sm">
          <kbd className="rounded-[8px] bg-s4 px-2 py-1 text-xs text-t2">7d</kbd> by price
          <ChevronDown className="ml-2 size-4 text-t2" strokeWidth={1.75} />
        </button>
      </div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full border-separate md:min-w-[860px] border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-left text-[13px] text-t3">
              <th className="hidden px-2 md:px-3 py-2 font-normal md:table-cell">Rank</th>
              <th className="px-2 md:px-3 py-2 font-normal">Token</th>
              <th className="px-2 md:px-3 py-2 text-right font-normal">Price</th>
              <th className="px-2 md:px-3 py-2 text-right font-normal">24h</th>
              <th className="hidden px-2 md:px-3 py-2 text-right font-normal md:table-cell">Volume 24h</th>
              <th className="hidden px-2 md:px-3 py-2 text-right font-normal md:table-cell">Market cap</th>
              <th className="hidden px-2 md:px-3 py-2 font-normal md:table-cell">7 days</th>
              <th className="hidden px-2 md:px-3 py-2 font-normal md:table-cell">Networks</th>
              <th className="px-2 md:px-3 py-2 text-center font-normal"><span className="sr-only md:not-sr-only">Operation</span></th>
            </tr>
          </thead>
          <tbody>
            {TOP_TOKENS.map((t, i) => {
              const px = prices?.[t.priceId];
              const spark = charts?.[t.priceId]?.map((x) => x.p) ?? [];
              const up = spark.length > 1 && spark.at(-1)! >= spark[0];
              const isSel = selected === t.symbol;
              const mk = markets?.[t.priceId];
              const onChain = !!findOnChain(t.symbol, TOKENS[chainId]);
              return (
                <motion.tr
                  key={t.symbol}
                  initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.04 }}
                  className="bg-s1 [&>td:first-child]:rounded-l-[12px] [&>td:last-child]:rounded-r-[12px]"
                >
                  <td className="num hidden px-2 md:px-3 py-2.5 text-t3 md:table-cell">#{i + 1}</td>
                  <td className="px-2 md:px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <TokenBadge symbol={t.symbol} color={t.color} size={26} src={mk?.image} />
                      <span>
                        <span className="block font-medium">{t.symbol}</span>
                        <span className="hidden text-xs text-t3 md:block">{t.name}</span>
                      </span>
                    </span>
                  </td>
                  <td className="num px-2 md:px-3 py-2.5 text-right">$ {formatUsd(px?.price)}</td>
                  <td className="px-2 md:px-3 py-2.5 text-right">
                    <Delta value={px?.change24h} className="text-[13px]" />
                  </td>
                  {/* shortcut: CoinGecko market cap stands in for spec's TVL (needs Uniswap pool data from the subgraph/API key). */}
                  <td className="num hidden px-2 md:px-3 py-2.5 text-right text-t2 md:table-cell">{formatCompactUsd(mk?.volume24h)}</td>
                  <td className="num hidden px-2 md:px-3 py-2.5 text-right text-t2 md:table-cell">{formatCompactUsd(mk?.marketCap)}</td>
                  <td className="hidden px-2 md:px-3 py-2.5 md:table-cell">
                    <Sparkline points={spark} color={up ? "var(--accent)" : "var(--negative)"} />
                  </td>
                  <td className="hidden px-2 md:px-3 py-2.5 md:table-cell">
                    <span className="flex -space-x-1.5">
                      {t.chains.map((c) => (
                        <span key={c} className="rounded-full ring-2 ring-s1">
                          <ChainDot chainId={c as SupportedChainId} size={20} />
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-2 md:px-3 py-2.5 text-center">
                    <button
                      onClick={() => onChain && setBuy(isSel ? null : t.symbol)}
                      aria-pressed={isSel}
                      aria-disabled={!onChain}
                      aria-label={onChain ? undefined : `Swap ${t.symbol}: not available on ${CHAIN_META[chainId].name}`}
                      title={onChain ? undefined : `Not available on ${CHAIN_META[chainId].name}`}
                      className={`relative inline-flex h-8 w-[76px] items-center md:w-[92px] justify-center overflow-hidden rounded-full text-[13px] font-semibold transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-35 ${isSel ? "bg-s4 text-white" : "bg-white text-black"}`}
                    >
                      {isSel && (
                        <motion.span
                          className="absolute size-8 rounded-full border border-accent"
                          initial={{ scale: 0.4, opacity: 0.9 }}
                          animate={{ scale: 3.4, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={String(isSel)} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="flex items-center gap-1">
                          {isSel ? (
                            <>
                              <Check className="size-3.5" /> Selected
                            </>
                          ) : (
                            "Swap"
                          )}
                        </motion.span>
                      </AnimatePresence>
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
