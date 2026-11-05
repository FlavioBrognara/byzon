import { arbitrum, base, mainnet, polygon } from "wagmi/chains";

export const SUPPORTED_CHAINS = [base, mainnet, arbitrum, polygon] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"];
export const DEFAULT_CHAIN = base;

const icon = (slug: string) => `https://icons.llamao.fi/icons/chains/rsz_${slug}?w=48&h=48`;

export const CHAIN_META: Record<SupportedChainId, { name: string; short: string; color: string; explorer: string; logo: string }> = {
  [base.id]: { name: "Base", short: "B", color: "#2F7BF6", explorer: "https://basescan.org", logo: icon("base") },
  [mainnet.id]: { name: "Ethereum", short: "E", color: "#8A92B2", explorer: "https://etherscan.io", logo: icon("ethereum") },
  [arbitrum.id]: { name: "Arbitrum", short: "A", color: "#28A0F0", explorer: "https://arbiscan.io", logo: icon("arbitrum") },
  [polygon.id]: { name: "Polygon", short: "P", color: "#8247E5", explorer: "https://polygonscan.com", logo: icon("polygon") },
};

export const isSupportedChain = (id: number | undefined): id is SupportedChainId =>
  id !== undefined && id in CHAIN_META;
