import { createConfig, http, injected } from "wagmi";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";
import { SUPPORTED_CHAINS } from "./chains";

export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byzon.app";

const metadata = {
  name: "Byzon",
  description: "Swap smarter on Ethereum, Base, Arbitrum and Polygon.",
  url: APP_URL,
  icons: [`${APP_URL}/icon.svg`],
};

// SSR note (SPEC §3.3): we keep the default localStorage storage and reconnect on the client.
// Cookie hydration would force `cookies()` into the layout and opt the whole shell out of prerendering.
export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  ssr: true,
  connectors: [
    injected(), // EIP-6963 discovery adds one connector per installed wallet
    // headless: no SDK install modal (it fights the Radix dialog); we render the display_uri QR ourselves.
    metaMask({ dapp: { name: metadata.name, url: metadata.url }, ui: { headless: true } }),
    // WalletConnect needs a project id; we render our own QR from the `display_uri` message.
    ...(WC_PROJECT_ID ? [walletConnect({ projectId: WC_PROJECT_ID, showQrModal: false, metadata })] : []),
    coinbaseWallet({ appName: metadata.name, appLogoUrl: metadata.icons[0] }),
  ],
  transports: Object.fromEntries(SUPPORTED_CHAINS.map((c) => [c.id, http()])) as Record<
    (typeof SUPPORTED_CHAINS)[number]["id"],
    ReturnType<typeof http>
  >,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
