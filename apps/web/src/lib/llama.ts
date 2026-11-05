import { cacheLife } from "next/cache";

const BASE = "https://coins.llama.fi";
export type Range = "24h" | "week" | "month";
export type Point = { t: number; p: number };

const RANGES: Record<Range, { seconds: number; span: number; period: string }> = {
  "24h": { seconds: 86_400, span: 48, period: "30m" },
  week: { seconds: 7 * 86_400, span: 42, period: "4h" },
  month: { seconds: 30 * 86_400, span: 30, period: "1d" },
};

export const isRange = (r: string | null): r is Range => r !== null && Object.hasOwn(RANGES, r);

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`DefiLlama ${res.status}`);
  return res.json() as Promise<T>;
}

type ChartResp = { coins: Record<string, { prices: { timestamp: number; price: number }[] }> };

export async function getChart(ids: string[], range: Range): Promise<Record<string, Point[]>> {
  "use cache";
  cacheLife("minutes");
  const r = RANGES[range];
  // Round start to 5 min so the cache key stays stable within the window.
  const start = Math.floor((Date.now() / 1000 - r.seconds) / 300) * 300;
  const j = await getJson<ChartResp>(`${BASE}/chart/${ids.join(",")}?start=${start}&span=${r.span}&period=${r.period}`);
  return Object.fromEntries(
    Object.entries(j.coins).map(([id, c]) => [id, c.prices.map((x) => ({ t: x.timestamp, p: x.price }))]),
  );
}

export async function getCurrent(ids: string[]): Promise<Record<string, { price: number; change24h?: number }>> {
  "use cache";
  cacheLife("minutes");
  const [cur, pct] = await Promise.all([
    getJson<{ coins: Record<string, { price: number }> }>(`${BASE}/prices/current/${ids.join(",")}`),
    getJson<{ coins: Record<string, number> }>(`${BASE}/percentage/${ids.join(",")}`).catch(() => ({ coins: {} as Record<string, number> })),
  ]);
  return Object.fromEntries(ids.map((id) => [id, { price: cur.coins[id]?.price, change24h: pct.coins[id] }]).filter(([, v]) => (v as { price?: number }).price !== undefined));
}

export type Market = { volume24h?: number; marketCap?: number; image?: string };

/** 24h volume, market cap and logo from CoinGecko's keyless API (DefiLlama has no volume). */
export async function getMarkets(ids: string[]): Promise<Record<string, Market>> {
  "use cache";
  cacheLife("minutes");
  const cg = ids.map((id) => id.replace("coingecko:", ""));
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cg.join(",")}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const rows = (await res.json()) as { id: string; total_volume?: number; market_cap?: number; image?: string }[];
  return Object.fromEntries(rows.map((r) => [`coingecko:${r.id}`, { volume24h: r.total_volume || undefined, marketCap: r.market_cap || undefined, image: r.image?.startsWith("https://coin-images.coingecko.com/") ? r.image : undefined }]));
}
