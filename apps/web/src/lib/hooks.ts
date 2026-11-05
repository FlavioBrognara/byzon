"use client";

import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { useBalance, useConnection, useConnections, useDisconnect, useReadContracts, useSwitchChain } from "wagmi";
import { erc20Abi, formatUnits, type Address } from "viem";
import { TOKENS } from "./tokens";
import type { Market, Point, Range } from "./llama";
import { isSupportedChain, type SupportedChainId } from "./chains";
import { useUI } from "@/stores/ui";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

export function usePrices(ids: readonly string[]) {
  const key = [...new Set(ids)].sort().join(",");
  return useQuery({
    queryKey: ["prices", key],
    queryFn: () => fetchJson<Record<string, { price: number; change24h?: number }>>(`/api/prices?kind=current&ids=${key}`),
    enabled: key.length > 0,
    refetchInterval: 60_000,
  });
}

export function useChart(ids: readonly string[], range: Range) {
  const key = [...new Set(ids)].sort().join(",");
  return useQuery({
    queryKey: ["chart", key, range],
    queryFn: () => fetchJson<Record<string, Point[]>>(`/api/prices?kind=chart&ids=${key}&range=${range}`),
    enabled: key.length > 0,
  });
}

export function useMarkets(ids: readonly string[]) {
  const key = [...new Set(ids)].sort().join(",");
  return useQuery({
    queryKey: ["markets", key],
    queryFn: () => fetchJson<Record<string, Market>>(`/api/prices?kind=markets&ids=${key}`),
    enabled: key.length > 0,
    refetchInterval: 300_000,
    staleTime: 120_000,
  });
}

/** Wallet chain when connected to a supported chain, else the app-selected chain. */
export function useActiveChain() {
  const { chainId, status } = useConnection();
  const appChainId = useUI((s) => s.appChainId);
  const setAppChainId = useUI((s) => s.setAppChainId);
  const { mutate: switchChain, isPending } = useSwitchChain();
  const connected = status === "connected";
  const wrongNetwork = connected && !isSupportedChain(chainId);
  const activeId: SupportedChainId = connected && isSupportedChain(chainId) ? chainId : appChainId;

  const select = (id: SupportedChainId) => {
    setAppChainId(id);
    if (connected) switchChain({ chainId: id });
  };
  return { chainId: activeId, select, wrongNetwork, switching: isPending };
}

const noopSubscribe = () => () => {};

/** True after hydration; used to swap SSR placeholders for wallet-dependent UI. */
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Balances (as numbers) for the curated tokens on a chain. Empty while disconnected. */
export function useTokenBalances(chainId: SupportedChainId) {
  const { address } = useConnection();
  const tokens = TOKENS[chainId];
  const erc20s = tokens.filter((t) => t.address !== "native");
  const native = useBalance({ address, chainId, query: { enabled: !!address } });
  const reads = useReadContracts({
    allowFailure: true,
    contracts: erc20s.map((t) => ({ address: t.address as Address, abi: erc20Abi, functionName: "balanceOf", args: [address!], chainId })),
    query: { enabled: !!address },
  });
  // `raw` is exact (use it for MAX and balance checks); `balances` is a display/sort approximation.
  const raw: Record<string, bigint> = {};
  const balances: Record<string, number> = {};
  if (address) {
    for (const t of tokens) {
      const r = t.address === "native" ? native.data?.value : (reads.data?.[erc20s.indexOf(t)] as { status: string; result?: bigint } | undefined)?.result;
      if (typeof r === "bigint") {
        raw[t.symbol] = r;
        balances[t.symbol] = Number(formatUnits(r, t.decimals));
      }
    }
  }
  return { raw, balances, isLoading: native.isLoading || reads.isLoading };
}

/** Connected = an address exists. wagmi's status flips to "connecting" during any attempt, even while connected. */
export function useIsConnected() {
  const mounted = useMounted();
  const { address } = useConnection();
  return mounted && !!address;
}

/** wagmi 3 keeps several connections; "Disconnect" must drop all of them or the next one takes over. */
export function useDisconnectAll() {
  const connections = useConnections();
  const { mutate: disconnect } = useDisconnect();
  return () => connections.forEach((c) => disconnect({ connector: c.connector }));
}
