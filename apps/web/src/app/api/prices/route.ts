import type { NextRequest } from "next/server";
import { getChart, getCurrent, getMarkets, isRange } from "@/lib/llama";
import { TOKENS, TOP_TOKENS } from "@/lib/tokens";

// Only ids the app actually shows, so the proxy can't be used as an open DefiLlama relay or cache-buster.
const ALLOWED = new Set([...Object.values(TOKENS).flat(), ...TOP_TOKENS].map((t) => t.priceId));

// GET /api/prices?kind=current|markets&ids=a,b   |   GET /api/prices?kind=chart&ids=a,b&range=24h|week|month
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const ids = [...new Set((q.get("ids") ?? "").split(",").filter(Boolean))].sort();
  if (ids.length === 0 || ids.length > 30 || !ids.every((id) => ALLOWED.has(id)))
    return Response.json({ error: "invalid ids" }, { status: 400 });

  const kind = q.get("kind");
  if (kind !== "chart" && kind !== "current" && kind !== "markets") return Response.json({ error: "invalid kind" }, { status: 400 });

  try {
    if (kind === "chart") {
      const range = q.get("range");
      if (!isRange(range)) return Response.json({ error: "invalid range" }, { status: 400 });
      return Response.json(await getChart(ids, range));
    }
    if (kind === "markets") return Response.json(await getMarkets(ids));
    return Response.json(await getCurrent(ids));
  } catch {
    return Response.json({ error: "price source unavailable" }, { status: 502 });
  }
}
