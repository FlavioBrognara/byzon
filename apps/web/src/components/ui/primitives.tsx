"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { CHAIN_META, type SupportedChainId } from "@/lib/chains";

export function ByzonMark({ size = 32 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}b`} x1="8" y1="58" x2="40" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1F4FE0" />
          <stop offset="1" stopColor="#4C8DFF" />
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="-4" y="-4" width="72" height="72">
          <rect x="-4" y="-4" width="72" height="72" fill="#fff" />
          <path d="M-4 22H40L24 42H68" stroke="#000" strokeWidth="5.5" strokeLinejoin="round" />
        </mask>
        <clipPath id={`${id}t`}>
          <path d="M-4-4H68V42H24L40 22H-4Z" />
        </clipPath>
        <clipPath id={`${id}c`}>
          <path d="M-4 22H40L24 42H68V68H-4Z" />
        </clipPath>
      </defs>
      <g mask={`url(#${id}m)`}>
        <circle cx="32" cy="32" r="28" fill="#fff" clipPath={`url(#${id}t)`} />
        <circle cx="32" cy="32" r="28" fill={`url(#${id}b)`} clipPath={`url(#${id}c)`} />
      </g>
    </svg>
  );
}

/** Token logo; falls back to a letter badge in the brand color when the image fails to load. */
export function TokenBadge({ symbol, color, size = 24, src }: { symbol: string; color: string; size?: number; src?: string }) {
  const [failed, setFailed] = useState<string>();
  if (src && failed !== src)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote token icons; next/image would need a loader + remotePatterns for one tiny icon
      <img
        src={src}
        referrerPolicy="no-referrer"
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(src)}
        // Catch images that already failed before hydration attached onError.
        ref={(el) => {
          if (el?.complete && el.naturalWidth === 0) setFailed(src);
        }}
        className="inline-block shrink-0 rounded-full bg-white/5 object-cover"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `radial-gradient(circle at 30% 25%, ${color}, color-mix(in oklab, ${color} 55%, #000))`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)",
      }}
      aria-hidden
    >
      {symbol.slice(0, 1)}
    </span>
  );
}

export function ChainDot({ chainId, size = 18 }: { chainId: SupportedChainId; size?: number }) {
  const m = CHAIN_META[chainId];
  return <TokenBadge symbol={m.short} color={m.color} size={size} src={m.logo} />;
}

/** Segmented control with the sliding pill (motion layoutId), as in the reference "24h / Week / Month". */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-[14px] border border-line bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="relative flex-1 rounded-[10px] py-2 text-sm text-t2 transition-colors aria-checked:text-white"
        >
          {value === o.value && (
            <motion.span
              layoutId={id}
              className="absolute inset-0 rounded-[10px] bg-s4"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Animated count-up for hero numerals (900 ms, ease-out). */
export function CountUp({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [text, setText] = useState(() => format(0));

  useEffect(() => mv.on("change", (v) => setText(format(v))), [mv, format]);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.jump(value); // fires "change", which updates the text
      return;
    }
    const c = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, value, reduce, mv, format]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

export function Sparkline({ points, color, width = 96, height = 28 }: { points: number[]; color: string; width?: number; height?: number }) {
  if (points.length < 2) return <span style={{ width, height }} className="inline-block" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const d = points
    .map((p, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * width).toFixed(1)} ${(height - 2 - ((p - min) / (max - min || 1)) * (height - 4)).toFixed(1)}`)
    .join("");
  return (
    <svg width={width} height={height} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Delta({ value, className = "" }: { value?: number; className?: string }) {
  if (value === undefined || !Number.isFinite(value)) return <span className={`text-t3 ${className}`}>—</span>;
  const up = value >= 0;
  return (
    <span className={`num ${className}`}>
      <span className={up ? "text-accent" : "text-negative"}>{up ? "+" : "−"}</span> {Math.abs(value).toFixed(2)}
      <span className="text-t3"> %</span>
    </span>
  );
}

/** Blur-in stagger used by the dashboard entrance (40 ms step, 400 ms each). */
export const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.4, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] as const },
});
