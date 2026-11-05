import { describe, expect, it } from "vitest";
import { orderConnectors } from "./connectors";
import { feeBps, swapButton } from "./swap";

const base = { connected: true, wrongNetwork: false, amount: "1", decimals: 18, balance: 2n * 10n ** 18n, sell: "ETH", buy: "USDC", liveRouting: true };

describe("feeBps", () => {
  it("applies the tiered schedule", () => {
    expect(feeBps("ETH", "USDC")).toBe(20);
    expect(feeBps("USDC", "DAI")).toBe(5);
    expect(feeBps("ETH", "WETH")).toBe(0);
    expect(feeBps("WETH", "ETH")).toBe(0);
  });
});

describe("swapButton", () => {
  it("walks the states in priority order", () => {
    expect(swapButton({ ...base, connected: false }).action).toBe("connect");
    expect(swapButton({ ...base, wrongNetwork: true }).action).toBe("switch");
    expect(swapButton({ ...base, buy: "ETH" }).disabled).toBe(true);
    expect(swapButton({ ...base, amount: "0" }).label).toBe("Enter an amount");
    expect(swapButton({ ...base, amount: "2.000000000000000001" }).label).toBe("Insufficient ETH balance");
    expect(swapButton({ ...base, liveRouting: false }).disabled).toBe(true);
    expect(swapButton(base)).toEqual({ label: "Review swap", action: "none", disabled: false });
  });
});

describe("orderConnectors", () => {
  it("puts EIP-6963 wallets first and hides duplicate SDK connectors", () => {
    const out = orderConnectors([
      { id: "injected", type: "injected", name: "Injected" },
      { id: "metaMaskSDK", type: "metaMask", name: "MetaMask", rdns: ["io.metamask", "io.metamask.mobile"] },
      { id: "walletConnect", type: "walletConnect", name: "WalletConnect" },
      { id: "io.metamask", type: "injected", name: "MetaMask" },
      { id: "io.rabby", type: "injected", name: "Rabby" },
    ]);
    expect(out.map((c) => c.id)).toEqual(["io.metamask", "io.rabby", "walletConnect"]);
    expect(out[0].detected).toBe(true);
  });

  it("marks an SDK connector detected when wagmi swallowed its EIP-6963 announcement", () => {
    const out = orderConnectors(
      [
        { id: "injected", type: "injected", name: "Injected" },
        { id: "walletConnect", type: "walletConnect", name: "WalletConnect" },
        { id: "metaMaskSDK", type: "metaMask", name: "MetaMask", rdns: ["io.metamask", "io.metamask.mobile"] },
      ],
      new Set(["io.metamask"]),
    );
    expect(out.map((c) => [c.id, c.detected])).toEqual([["metaMaskSDK", true], ["walletConnect", false]]);
  });
});
