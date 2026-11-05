import type { Address } from "viem";
import type { SupportedChainId } from "./chains";

export type Token = {
  symbol: string;
  name: string;
  /** "native" for the chain's gas token */
  address: Address | "native";
  decimals: number;
  /** DefiLlama price key */
  priceId: string;
  color: string;
};

const T = (symbol: string, name: string, address: Token["address"], decimals: number, cg: string, color: string): Token => ({
  symbol,
  name,
  address,
  decimals,
  priceId: `coingecko:${cg}`,
  color,
});

const ETH = T("ETH", "Ether", "native", 18, "ethereum", "#8A92B2");

// shortcut: curated subset of tokens.uniswap.org; swap to the full list + user imports in Phase 2.
export const TOKENS: Record<SupportedChainId, Token[]> = {
  8453: [
    ETH,
    T("USDC", "USD Coin", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 6, "usd-coin", "#2775CA"),
    T("WETH", "Wrapped Ether", "0x4200000000000000000000000000000000000006", 18, "weth", "#EC4899"),
    T("cbBTC", "Coinbase BTC", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", 8, "coinbase-wrapped-btc", "#F7931A"),
    T("AERO", "Aerodrome", "0x940181a94A35A4569E4529A3CDfB74e38FD98631", 18, "aerodrome-finance", "#0433FF"),
    T("DAI", "Dai", "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", 18, "dai", "#F5AC37"),
  ],
  1: [
    ETH,
    T("USDC", "USD Coin", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6, "usd-coin", "#2775CA"),
    T("USDT", "Tether", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6, "tether", "#26A17B"),
    T("WBTC", "Wrapped BTC", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", 8, "wrapped-bitcoin", "#F7931A"),
    T("UNI", "Uniswap", "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 18, "uniswap", "#FF007A"),
    T("LINK", "Chainlink", "0x514910771AF9Ca656af840dff83E8264EcF986CA", 18, "chainlink", "#2A5ADA"),
  ],
  42161: [
    ETH,
    T("USDC", "USD Coin", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 6, "usd-coin", "#2775CA"),
    T("ARB", "Arbitrum", "0x912CE59144191C1204E64559FE8253a0e49E6548", 18, "arbitrum", "#28A0F0"),
    T("WBTC", "Wrapped BTC", "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", 8, "wrapped-bitcoin", "#F7931A"),
    T("LINK", "Chainlink", "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4", 18, "chainlink", "#2A5ADA"),
  ],
  137: [
    T("POL", "Polygon", "native", 18, "polygon-ecosystem-token", "#8247E5"),
    T("USDC", "USD Coin", "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", 6, "usd-coin", "#2775CA"),
    T("USDT", "Tether", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 6, "tether", "#26A17B"),
    T("WETH", "Wrapped Ether", "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", 18, "weth", "#EC4899"),
    T("WBTC", "Wrapped BTC", "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", 8, "wrapped-bitcoin", "#F7931A"),
  ],
};



/** DefiLlama token icon CDN; native gas tokens use the zero address. Badges fall back to a letter on 404. */
export const tokenLogo = (chainId: number, t: Pick<Token, "address">) =>
  `https://token-icons.llamao.fi/icons/tokens/${chainId}/${t.address === "native" ? "0x0000000000000000000000000000000000000000" : t.address.toLowerCase()}?h=48&w=48`;

// Top tokens lists BTC; each chain carries a wrapped version.
const ALIAS: Record<string, string[]> = { BTC: ["WBTC", "cbBTC"] };
/** The chain's token for a Top-tokens symbol (BTC → WBTC/cbBTC), if the chain lists one. */
export const findOnChain = (symbol: string, tokens: readonly Token[]) =>
  tokens.find((t) => t.symbol === symbol || ALIAS[symbol]?.includes(t.symbol));

/** Market-wide list for the Top tokens table (chain-agnostic). */
const TOP = [
  { symbol: "ETH", name: "Ether", priceId: "coingecko:ethereum", color: "#8A92B2" },
  { symbol: "BTC", name: "Bitcoin (wrapped)", priceId: "coingecko:bitcoin", color: "#F7931A" },
  { symbol: "UNI", name: "Uniswap", priceId: "coingecko:uniswap", color: "#FF007A" },
  { symbol: "LINK", name: "Chainlink", priceId: "coingecko:chainlink", color: "#2A5ADA" },
  { symbol: "ARB", name: "Arbitrum", priceId: "coingecko:arbitrum", color: "#28A0F0" },
  { symbol: "AERO", name: "Aerodrome", priceId: "coingecko:aerodrome-finance", color: "#0433FF" },
  { symbol: "POL", name: "Polygon", priceId: "coingecko:polygon-ecosystem-token", color: "#8247E5" },
] as const;
/** Top tokens with the chains (from TOKENS) where Byzon can actually swap them. */
export const TOP_TOKENS = TOP.map((t) => ({
  ...t,
  chains: Object.keys(TOKENS)
    .map(Number)
    .filter((id) => findOnChain(t.symbol, TOKENS[id as keyof typeof TOKENS])),
}));
