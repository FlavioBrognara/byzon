export const shortAddress = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

/** USD with adaptive precision: $0.000123, $1.23, $12,345.67, $1.2M */
export function formatUsd(v: number | undefined, { compact = false } = {}): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (compact && abs >= 1e6)
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(v);
  const digits = abs === 0 ? 2 : abs < 0.01 ? 6 : abs < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: Math.min(digits, 2), maximumFractionDigits: digits }).format(v);
}

/** Token amounts: up to 6 significant decimals, never scientific notation. */
export function formatAmount(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  if (Math.abs(v) < 0.000001) return "<0.000001";
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: Math.abs(v) >= 1 ? 8 : 4, maximumFractionDigits: 6 }).format(v);
}

export const formatPct = (v: number | undefined) =>
  v === undefined || !Number.isFinite(v) ? "—" : `${Math.abs(v).toFixed(2)}`;

/** Plain decimal (no exponent), at most `decimals` fraction digits, so it always passes the input regex. */
export const toInput = (n: number, decimals: number) => {
  const s = n.toLocaleString("en-US", { useGrouping: false, maximumSignificantDigits: 8 });
  const [i, f = ""] = s.split(".");
  const frac = f.slice(0, decimals).replace(/0+$/, "");
  return frac ? `${i}.${frac}` : i;
};

/** $1.2B style for table stats. */
export const formatCompactUsd = (v: number | undefined) =>
  v === undefined || !Number.isFinite(v) ? "—" : `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
