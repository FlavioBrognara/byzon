/** Detected wallets first; hide SDK duplicates of what was detected and the generic injected when anything was. */
export function orderConnectors<C extends { id: string; type: string; name: string; rdns?: string | readonly string[] }>(
  list: readonly C[],
  seenRdns: ReadonlySet<string> = new Set(),
): (C & { detected: boolean })[] {
  // wagmi drops EIP-6963 announcements whose rdns matches a configured connector (MetaMask, Coinbase),
  // so those count as detected when their rdns was announced on the page.
  const rdnsOf = (c: C) => (c.rdns === undefined ? [] : typeof c.rdns === "string" ? [c.rdns] : c.rdns);
  const injected = list.filter((c) => c.type === "injected" && c.id !== "injected");
  const injectedIds = new Set(injected.map((c) => c.id));
  // SDK connector whose wallet is already listed as its own EIP-6963 connector: hide the duplicate.
  const dup = (c: C) => c.type !== "injected" && rdnsOf(c).some((r) => injectedIds.has(r));
  const sdkDetected = list.filter((c) => c.type !== "injected" && !dup(c) && rdnsOf(c).some((r) => seenRdns.has(r)));
  const detected = [...injected, ...sdkDetected];
  const rest = list.filter((c) => {
    if (detected.includes(c) || dup(c)) return false;
    if (c.type === "injected") return c.id === "injected" && detected.length === 0 && typeof window !== "undefined" && "ethereum" in window;
    return true;
  });
  return [...detected.map((c) => ({ ...c, detected: true })), ...rest.map((c) => ({ ...c, detected: false }))];
}
