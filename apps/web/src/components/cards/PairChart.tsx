"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { ChevronDown, Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { Point, Range } from "@/lib/llama";
import { formatUsd } from "@/lib/format";
import { useChart, useMarkets } from "@/lib/hooks";
import { TOP_TOKENS } from "@/lib/tokens";
import { CountUp, Delta, Segmented, TokenBadge } from "@/components/ui/primitives";

const W = 300;
const H = 150;
const RANGES = [
  { value: "24h", label: "24h" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

const fmtDate = (t: number, range: Range) =>
  new Date(t * 1000).toLocaleString("en-US", range === "24h" ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric" });

export function PairChart() {
  const [range, setRange] = useState<Range>("week");
  const [sym, setSym] = useState<string>("ETH");
  const token = TOP_TOKENS.find((t) => t.symbol === sym)!;
  const { data, isError } = useChart([token.priceId], range);
  const pts: Point[] = useMemo(() => data?.[token.priceId] ?? [], [data, token.priceId]);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const { data: markets } = useMarkets(TOP_TOKENS.map((t) => t.priceId));

  const geo = useMemo(() => {
    if (pts.length < 2) return null;
    const ps = pts.map((x) => x.p);
    const min = Math.min(...ps);
    const max = Math.max(...ps);
    const xy = pts.map((x, i) => [(i / (pts.length - 1)) * W, 12 + (1 - (x.p - min) / (max - min || 1)) * (H - 24)] as const);
    // Smooth with Catmull-Rom → cubic Bézier so the line reads like the reference curve.
    let d = `M${xy[0][0]},${xy[0][1]}`;
    for (let i = 0; i < xy.length - 1; i++) {
      const [p0, p1, p2, p3] = [xy[i - 1] ?? xy[i], xy[i], xy[i + 1], xy[i + 2] ?? xy[i + 1]];
      d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return { xy, d };
  }, [pts]);

  const change = pts.length > 1 ? ((pts.at(-1)!.p - pts[0].p) / pts[0].p) * 100 : undefined;
  const h = hover !== null && geo ? { pt: pts[hover], xy: geo.xy[hover] } : null;

  return (
    <section aria-labelledby="markets-title" className="flex flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="markets-title" className="text-[22px] font-semibold tracking-tight">Markets</h2>
          <p className="mt-0.5 text-sm text-t3">
            Live prices from <span className="text-t2">on-chain oracles</span>
          </p>
        </div>
        <Menu.Root>
          <Menu.Trigger className="flex h-10 items-center gap-2 rounded-[12px] border border-line bg-s3 px-3.5 text-sm">
            <TokenBadge symbol={token.symbol} color={token.color} size={18} src={markets?.[token.priceId]?.image} /> {token.symbol}
            <ChevronDown className="size-4 text-t2" strokeWidth={1.75} />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={8} className="card-glass z-50 min-w-[180px] p-1.5 text-sm">
              {TOP_TOKENS.map((t) => (
                <Menu.Item key={t.symbol} onSelect={() => setSym(t.symbol)} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 outline-none data-[highlighted]:bg-white/[0.06]">
                  <TokenBadge symbol={t.symbol} color={t.color} size={20} src={markets?.[t.priceId]?.image} /> {t.symbol}
                  <span className="ml-auto text-xs text-t3">{t.name}</span>
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>

      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="pair-chart" className="mb-3 flex h-10 items-center justify-center gap-2 rounded-[12px] border border-line bg-s2 text-sm text-t2 md:hidden">
        {open ? "Hide chart" : `Show ${token.symbol} chart`}
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.75} />
      </button>
      <div id="pair-chart" className={`card-glass p-5 ${open ? "" : "max-md:hidden"}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-medium">{token.symbol} / USD</h3>
          <Info className="size-[18px] text-t2" strokeWidth={1.5} aria-label="Prices are aggregated by DefiLlama" />
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-y-1.5 text-[13px]">
          <dt className="text-t3">Price</dt>
          <dd className="num text-right">$ {formatUsd(pts.at(-1)?.p)}</dd>
          <dt className="text-t3">Range high</dt>
          <dd className="num text-right">$ {formatUsd(pts.length ? Math.max(...pts.map((x) => x.p)) : undefined)}</dd>
        </dl>

        <div className="mt-4">
          <Segmented label="Chart range" value={range} options={RANGES} onChange={setRange} />
        </div>

        <div className="relative mt-4" onMouseLeave={() => setHover(null)}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[160px] w-full overflow-visible"
            preserveAspectRatio="none"
            onMouseMove={(e) => {
              if (!geo) return;
              const r = e.currentTarget.getBoundingClientRect();
              setHover(Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1)));
            }}
            role="img"
            aria-label={`${token.symbol} price chart, ${range}`}
          >
            {geo && (
              <motion.path
                key={`${sym}-${range}`}
                d={geo.d}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ filter: "drop-shadow(0 0 6px rgba(47,123,246,.6))" }}
              />
            )}
            {h && <line x1={h.xy[0]} x2={h.xy[0]} y1={0} y2={H} stroke="rgba(255,255,255,.35)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
          </svg>
          {!geo && <div className="absolute inset-0 grid place-items-center text-sm text-t3">{isError ? "Price feed unavailable" : "Loading…"}</div>}
          {h && (
            <>
              <span className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent" style={{ left: `${(h.xy[0] / W) * 100}%`, top: `${(h.xy[1] / H) * 160}px` }} />
              <div
                className="pointer-events-none absolute top-1/2 z-10 rounded-[12px] border border-line-strong bg-s3/90 px-3 py-2 text-[13px] backdrop-blur-md"
                style={{ left: `${Math.min(70, (h.xy[0] / W) * 100)}%` }}
              >
                <div className="font-medium">{fmtDate(h.pt.t, range)}</div>
                <div className="num mt-1 text-t2">
                  <span className="text-t3">$</span> {formatUsd(h.pt.p)}
                </div>
                <Delta value={((h.pt.p - pts[0].p) / pts[0].p) * 100} className="text-xs" />
              </div>
            </>
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs text-t3">
          {pts.length > 3 && [0, 1, 2, 3].map((k) => <span key={k}>{fmtDate(pts[Math.round((k / 3) * (pts.length - 1))].t, range)}</span>)}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div className="num text-[38px] font-medium leading-none tracking-tight">
            {change !== undefined && (
              <>
                <span className={change >= 0 ? "text-accent" : "text-negative"}>{change >= 0 ? "+" : "−"}</span>
                <CountUp key={`${sym}-${range}`} value={Math.abs(change)} format={(n) => n.toFixed(2)} />
                <span className="align-top text-lg text-t2">%</span>
              </>
            )}
          </div>
          <div className="text-right text-xs text-t3">
            Last updated
            <div className="mt-0.5 text-[13px] text-t1">{pts.length ? `Today, ${new Date(pts.at(-1)!.t * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "—"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
