# Byzon — Project Spec (v0.2)

> **Byzon** is an EVM token swap app. Uniswap supplies the routing and liquidity. Byzon adds its own Solidity contracts for fees, one-transaction multi-swaps, and **Autopilot** (automatic, recurring and conditional orders where the funds stay in the user's wallet). The UI is a premium dark dashboard copied from `dashboard-ui-ux.mp4`.
> Status: **v0.2: your answers are in; awaiting final validation.** Decisions are logged in §11.
> Brand assets: `brand/` (see §2.7).

---

## 1. Goals and non-goals

**Goals**
1. Swap any ERC-20 / native token on the supported EVM chains with best-price routing, slippage protection and clear tx feedback.
2. Wallet connection that works with MetaMask (and any EIP-6963 browser wallet), WalletConnect (mobile QR / deep link) and Coinbase Wallet.
3. A UI that matches the reference video as closely as possible: colors, card system, typography, 3D orb, intro animation, chart interactions, button micro-interactions.
4. Liquidity and routing come from the **Uniswap Trading API** (v2/v3/v4 pools + UniswapX). Byzon does **not** build its own AMM. Byzon's own Solidity contracts (§7) sit on top: **ByzonRouter** (fees, dust sweep, basket buy) and **ByzonAutopilot** (DCA, limit, stop-loss and take-profit orders).
5. UI language: **English** only. No i18n framework in v1.

**Non-goals (v1)**
- Liquidity provision UI (add/remove LP positions): Phase 4+.
- Limit orders, bridging, fiat on-ramp, our own token, governance.
- Mobile native app (responsive web only).

---

## 2. Reference UI analysis (from the video)

### 2.1 What the video shows (13 s)
| Time | What happens |
|---|---|
| 0.0–1.0 s | Black canvas. A single centered card ("Total Balance") fades in. Number shows `$ 21,941.66` and **counts up** to `$ 23,094.57`. Secondary labels at ~30% opacity. |
| 1.0–2.0 s | Labels fade in to full opacity ("Compared to last month −37.16 %", "How it works?"). An empty inner panel appears (dark, blurred). |
| 2.0–3.5 s | Inner panel lights up with a deep-blue radial glow and particles; a **3D blue twisted/petal orb** rises from the bottom (blur → sharp). Text "Ai Assistant / is updating the balance amount now…" with a spinner fades in. |
| 3.5–5.0 s | **Camera zoom-out**: the card scales down and the surrounding grid of cards slides in from the edges (left chart card, right promo card, bottom table). |
| 5.0–7.0 s | Full dashboard. Header items, sidebar icons and table rows **stagger in**. Chart line **draws itself** left→right. Big `+ 7.76 %` counts up to `+ 14.96 %`. |
| 7.0–13 s | Interactions: chart hover shows a dashed vertical guide + floating tooltip (`Mar 29 · $ 5,538.65 · + 9.41 %`); a table "Join" button morphs to an outlined "Requested" state with a circular ripple. Header pills (date, profile) appear last. |

### 2.2 Layout (desktop ≥ 1280 px)
```
┌──────┬───────────────────────────────────────────────────────────────────────────┐
│ Logo │ Page ▾          [ 🔍 Search…          ⌘K ]  [🔔 2 new]  [‹ Today ›]  (👤 Name ▾) │
├──────┼──────────────────────────┬────────────────────────────────────────────────┤
│  ⌂   │ Section title    [Sel ▾] │ Section title   [Sel ▾] │  Promo / side card    │
│  📣  │ ┌ Chart card ──────────┐ │ ┌ Hero card ──────────┐ │  (gold 3D chip)       │
│  📋  │ │ 24h | Week | Month   │ │ │ $ 23,094.57         │ │                       │
│  🎓  │ │ ~~~ line chart ~~~   │ │ │ ┌ 3D orb panel ────┐ │ │                       │
│  💳  │ │ + 14.96 %            │ │ │ └──────────────────┘ │ │                       │
│      │ └──────────────────────┘ │ └─────────────────────┘ └───────────────────────┤
│      │ ┌ Carousel (2 cards) ──┐ │ ┌ Table: Rank | Name | … | Status | Operation ─┐ │
│  ⚙   │ └──────────────────────┘ │ └──────────────────────────────────────────────┘ │
│  ⇥   │                          │                                                  │
└──────┴──────────────────────────┴────────────────────────────────────────────────┘
```
Thin vertical 1 px divider between left column and the rest; 72 px icon rail; ~64 px header.

### 2.3 Mapping the reference to a swap app
| Reference element | Swap app equivalent |
|---|---|
| Logo + "Dashboard ▾" | Byzon mark + current section ("Swap ▾", "Autopilot", "Explore", "Portfolio") |
| Search "STOMina campaign" + upload icon | Token search (symbol / name / address), `⌘K` shortcut |
| 🔔 "2 new" | Activity: pending / recent transactions count |
| "‹ Today, Apr 8 ›" pill | **Network selector pill** (‹ chain icon + name ›) |
| Avatar + "Hossein @user680523" | **Wallet pill**: ENS avatar (or blockie) + ENS name / short address; menu: copy, explorer, switch wallet, disconnect |
| Icon rail | Swap · Autopilot · Explore tokens · Portfolio · Activity / Settings · Disconnect |
| "My Campaigns → Overview" chart card | **Pair price chart** (output vs input token) with 24h / Week / Month segmented control, hover tooltip, big % change with blue "+" |
| "My Top Campaigns" carousel | **My top holdings** carousel (token cards: symbol, balance, USD value, 24h %, "+" = quick swap) |
| "Total Balance" hero card | **Swap card** (see §3.4). Keeps the giant numeral style (blue currency symbol + white number) |
| "Ai Assistant" 3D orb panel | **Route Assistant** panel inside the swap card: "is finding the best route now…" while quoting; then shows route summary (pools/hops, gas, price impact) |
| "Ads / Let's Go Premium 40%" card | **Byzon Pulse** card, a carousel of slides changed with "Next →". Details in §2.8 |
| "Popular Campaigns" table | **Top tokens** table: Rank, Token, Price, 24h, Volume, TVL, 7d sparkline (replaces avatar stack), Network chip (replaces Public/Private), Operation = white "Swap" pill |
| "Join → Requested" morph | "Swap" → "Selected" morph when picking a token from the table into the swap card |

### 2.4 Design tokens (eyeballed from frames; to be refined with the color picker on the 1600×1200 source)
```
Colors
--bg-app        #000000   page / app frame
--bg-outer      linear-gradient(135deg, #A4ABB6 → #5B616C)  (only for the showcase frame; real app is full-bleed black)
--surface-1     #0C0C0E   column backgrounds
--surface-2     #141417   cards
--surface-3     #1C1C20   inner cards, inputs, segmented track
--surface-4     #2A2A2F   active segment, selects, chips
--border        rgba(255,255,255,0.06)   card borders (1 px, inner highlight on top edge rgba(255,255,255,0.08))
--text-1        #FFFFFF
--text-2        rgba(255,255,255,0.62)
--text-3        rgba(255,255,255,0.38)
--accent        #2F7BF6   (blue: "$", "+", arrows, chart line, links)
--accent-glow   #1E4FD8 → #0A1A4A  radial (orb panel + chart card bottom)
--negative      #F0483E
--positive      #2F7BF6   (positives use the blue accent, not green — as in the reference)
--gold          #F7C94B → #D9A21E  (3D chip)
--dot-lime      #D4F25A   --dot-cyan #4FD1E8  (status dots on carousel cards)
--btn-primary   #FFFFFF bg / #000 text, pill radius
Radius:  frame 24 · card 22 · inner card 16 · input/select 12 · pill 999
Shadow:  cards have no drop shadow; depth = surface steps + 1 px borders + subtle inner top highlight
Glass:   chart card + orb panel: bg gradient to blue at bottom, backdrop-blur 20px, faint 24 px grid pattern at 4% opacity
```
**Typography**: neutral grotesk with tight tracking; reference is SF Pro Display–like. Use **Inter Display** (variable, `font-feature-settings: "tnum","ss01"`) for UI and numerals. Sizes: hero numeral 44/48 px weight 500 (`$` in accent), section titles 20 px/600, card titles 15 px/500, body 13 px, captions 12 px `--text-3`. Fallback option: Geist.

**Icons**: thin 1.5 px stroke line icons (Lucide or Phosphor "regular").

### 2.5 Motion spec
| Effect | Implementation | Timing |
|---|---|---|
| Intro sequence (first visit per session) | Framer Motion orchestration: hero card alone → orb reveal → layout zoom-out (`scale 1.6 → 1`, other cards `x/y ±80px, opacity 0 → 1`) | ~3.5 s total, skippable on click/keypress, skipped if `prefers-reduced-motion` |
| Number count-up | `useSpring` on value, tabular numerals, no layout shift | 900 ms, ease-out |
| Stagger in | children `opacity 0 → 1, y 8 → 0, blur 6px → 0` | 40 ms stagger, 400 ms each |
| Chart line draw | SVG `pathLength 0 → 1` | 1.2 s ease-in-out |
| Chart hover | crosshair dashed line + dot + tooltip card (glass) following pointer, snaps to data points | spring |
| Segmented control | shared-layout `layoutId` pill slides between 24h/Week/Month | 250 ms spring |
| Button morph (Swap → Selected) | bg white → transparent + 1 px white border, text swap with crossfade, ripple circle from click point | 300 ms |
| Spinner | thin ring, 1 s linear | — |
| 3D orb | slow idle rotation (Y axis ~8°/s), subtle breathing scale, speeds up while quoting, settles on quote ready | continuous |
| Card hover | border brightens to 10%, 1 px translate-y | 150 ms |

### 2.6 3D assets
- **Blue orb** (twisted petal sphere): built in **React Three Fiber** as procedural geometry (N twisted lathe "petals" around Y), `MeshPhysicalMaterial` (blue #1F5BFF, clearcoat 1, roughness 0.25, sheen), studio HDRI env, soft blue rim light. Particles = instanced points with depth fade. Lazy-loaded (dynamic import, `ssr: false`); static WebP fallback for low-power devices / reduced motion / WebGL unavailable.
- **Gold "40%" chip**: CSS-only (gradient + layered offset shadow for extrusion, slight 3D tilt on hover via `perspective`). Content changes to a token/network badge.
- Alternative if the procedural orb doesn't match well enough: model it in Blender/Spline and export glTF (Draco) ≤ 300 KB.

### 2.7 Brand: Byzon logo
Files in `brand/` (generated from `brand/gen-logo.mjs`, a single source of geometry). Preview: `brand/preview.png`.

| File | Use |
|---|---|
| `byzon-mark.svg` | primary mark (rail/header, favicon source) |
| `byzon-logo-dark.svg` / `byzon-logo-light.svg` | mark + "byzon" wordmark |
| `byzon-mark-mono-white.svg` / `-mono-black.svg` | single-color uses (watermarks, merch, embossing) |
| `byzon-app-icon.svg` | PWA / social / app icon (black squircle, blue under-glow) |

**Concept**: a coin split by a **Z-shaped cut** into two interlocking halves. The white top half and the blue bottom half are two tokens trading places; the cut traces the **Z** in Byzon and also reads as a route line (in → hop → out). It's flat, geometric and heavy-weight, matching the bold mark style of the reference.
**Wordmark**: lowercase "byzon", Inter Display SemiBold, tracking −4%. Before launch, convert the wordmark text to outlines so it renders the same without the font.
**Motion**: on load and while a swap is confirming, the two halves slide apart along the Z and snap back (the "swap" gesture). This can be used as the brand loading state.

### 2.8 Byzon Pulse card (replaces the "Ads / Premium" card)
A smart card that shows the most useful slide for the current wallet state. "Next →" cycles slides; "Don't show again" hides that slide type (localStorage). The gold 3D chip becomes each slide's key figure.

| Slide | Shown when | Content | Gold chip | CTA |
|---|---|---|---|---|
| **Welcome** | disconnected | "Swap smarter on 4 chains. Fees from 0.05%." | `0.05%` | Connect wallet |
| **Gas Weather** | always | Forecast-style list with one row per chain: "Base: clear skies, swap ≈ $0.01", "Ethereum: stormy, ≈ $4.80". Weather icon depends on gwei vs. 7-day median | cheapest chain cost, e.g. `$0.01` | Swap on {cheapest} |
| **Dust Sweep** | connected and ≥ 3 balances under $10 | "You have 7 dust tokens worth $23.40. Sweep them into one token in one transaction." | `$23` | Sweep to USDC |
| **Autopilot** | connected | "Let's go Autopilot: buy ETH every week automatically. Funds stay in your wallet." | `DCA` | Set it up |
| **Order fired** | an Autopilot order executed since last visit | "Your stop-loss on ARB executed at $0.71" | `✓` | View |

### 2.9 Responsive
- ≥ 1280: 3-column layout as above.
- 768–1279: icon rail stays; left column (chart + holdings) moves below swap card; promo card becomes a banner.
- < 768: bottom tab bar replaces rail; **swap card first**, chart collapsible, table becomes a card list. Intro animation disabled.

---

## 3. Front-end architecture

### 3.1 Stack
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript (strict)** | SSR shell, route handlers as BFF, Vercel deploy |
| Styling | **Tailwind CSS v4** with tokens from §2.4 as CSS variables | fastest way to match the design precisely |
| UI primitives | **Radix UI** (Dialog, Popover, DropdownMenu, Tooltip) | accessible, unstyled |
| Animation | **Motion (Framer Motion)** | orchestration, layout animations, springs |
| 3D | **three + @react-three/fiber + @react-three/drei** | orb |
| Web3 | **wagmi + viem** | hooks, connectors, typed contract calls |
| Server state | **TanStack Query** (comes with wagmi) | quotes, prices, balances caching |
| Client state | **Zustand** (swap form, settings, UI) persisted to localStorage where relevant | small, simple |
| Charts | Custom SVG + d3-shape/d3-scale (line + area + crosshair) | full control to match the look; lightweight |
| Token math | **@uniswap/sdk-core** (`Token`, `CurrencyAmount`, `Percent`) | precise decimal math, Uniswap-compatible |
| Validation | **zod** at every API boundary | |
| Tests | Vitest + Testing Library (unit), Playwright (e2e with a mocked injected wallet + Anvil fork) | |

### 3.2 Folder structure
Monorepo (pnpm workspaces): `apps/web` (Next.js, below), `contracts/` (Foundry, §7.5), `packages/abi` (generated ABIs + addresses per chain), `apps/keeper` (Phase 5).
```
apps/web/app/
  (app)/autopilot/page.tsx  Phase 5
  (app)/layout.tsx          shell: rail + header + providers
  (app)/swap/page.tsx       default route (/ redirects here)
  (app)/explore/page.tsx
  (app)/portfolio/page.tsx
  (app)/activity/page.tsx
  api/quote/route.ts        BFF → Uniswap Trading API (holds API key)
  api/swap/route.ts         BFF → build swap calldata
  api/approval/route.ts     BFF → check/prepare approval (Permit2)
  api/prices/route.ts       token prices + chart series (cached)
  api/tokens/route.ts       merged token list (cached)
components/
  shell/  (Rail, Header, NetworkPill, WalletPill, SearchCommand, ActivityBell)
  wallet/ (ConnectModal, WalletOption, QrPanel, AccountMenu, WrongNetworkBanner)
  swap/   (SwapCard, AmountInput, TokenSelect, FlipButton, RouteAssistant, ReviewModal, SettingsPopover)
  charts/ (PairChart, Sparkline, SegmentedRange)
  tokens/ (TopTokensTable, HoldingsCarousel, TokenIcon)
  three/  (Orb, OrbFallback)
  motion/ (IntroSequence, CountUp, Stagger)
lib/
  wagmi.ts  chains.ts  tokens.ts  format.ts  uniswap/ (types, client)
stores/ swap.ts settings.ts activity.ts
```

### 3.3 Wallet connection — **Phase 1 focus**

**Connectors (wagmi)**
1. `injected()` with **EIP-6963 multi-provider discovery** → lists every installed browser wallet (MetaMask, Rabby, Brave, OKX…) with its own icon.
2. `metaMask()` (MetaMask SDK) → covers "MetaMask not installed" on desktop (install link) and mobile (deep link into MetaMask app).
3. `walletConnect({ projectId, showQrModal: false, metadata })` → we render **our own QR** in the custom modal using the `display_uri` event, so the modal matches the design. Mobile: list of wallet deep links (WalletConnect Explorer API) instead of QR.
4. `coinbaseWallet({ appName })`.

**Why a custom modal instead of Reown AppKit / RainbowKit**: both are themeable only to a point; the reference look (glass cards, orb, motion) needs full control. Fallback if time-boxed: RainbowKit with a custom theme (½ day) and replace later.

**Connect modal UX**
- Trigger: "Connect wallet" in header pill, wallet card CTA, and swap button when disconnected.
- Layout: left list (detected wallets first with "Detected" chip, then MetaMask, WalletConnect, Coinbase), right panel = state: intro (orb mini + "What is a wallet?") / connecting (spinner + "Confirm in MetaMask") / QR (WalletConnect, copy-link button) / error (retry).
- States: idle → connecting → connected | rejected (user denied: soft message, retry) | error (not installed → install link; chain unsupported → switch prompt).

**Session behavior**
- SSR-safe: wagmi `ssr: true` with default localStorage persistence. The wallet pill renders a fixed-size placeholder until mount/reconnect resolves (no layout shift). *Deviation from v0.2:* cookie hydration (`cookieStorage` + `cookieToInitialState`) would call `cookies()` in the root layout, which makes the whole route dynamic under Cache Components; revisit if a connected-state flash becomes a complaint.
- Auto-reconnect last connector on load.
- Listens to `accountsChanged` / `chainChanged` / `disconnect`: reset quote, refetch balances, toast on account switch.
- **Wrong network**: if wallet chain ∉ supported chains → banner + swap button becomes "Switch to Base" (`switchChain`, with `wallet_addEthereumChain` fallback handled by wagmi).
- Network pill: switches the app chain; if connected, asks the wallet to switch too.
- ENS name + avatar resolved on mainnet (viem `getEnsName`/`getEnsAvatar`), blockie fallback.
- Account menu: copy address, view on explorer, recent activity, switch wallet, disconnect.
- No sign-in (SIWE) in v1 — no backend user accounts needed. (Add SIWE only if we add server-side user features.)

**Acceptance criteria (Phase 1)**
- [ ] MetaMask desktop: connect, reject, reconnect on reload, switch account, switch chain from wallet and from app, disconnect.
- [ ] Rabby/other EIP-6963 wallets appear automatically with correct name/icon.
- [ ] WalletConnect: QR connects MetaMask Mobile / Rainbow / Trust; session survives reload; disconnect from phone updates UI.
- [ ] Mobile browser (iOS Safari, Android Chrome): MetaMask deep link and WalletConnect deep link work.
- [ ] Unsupported chain shows banner and one-click switch.
- [ ] No hydration warnings; no layout shift in header between SSR and client.
- [ ] Keyboard: modal fully navigable, focus trap, `Esc` closes, visible focus rings; screen-reader labels on all icon buttons.

### 3.4 Swap card (Phase 2)
Visual: same frame as the "Total Balance" hero card.
```
Swap                                         [⚙ 0.5% ▾]
Best price across Uniswap pools
┌───────────────────────────────────────────────────────┐
│ You pay                               Balance 1.204 MAX│
│ $ 1,250.00                               [ ◉ ETH ▾ ]   │  ← giant numeral, token-colored symbol
│ ≈ $ 3,912.40                                           │
├────────────────────── ( ⇅ ) ──────────────────────────┤
│ You receive                                            │
│ 3,905.11                                 [ ◉ USDC ▾ ]  │
│ ≈ $ 3,905.11   (−0.19 %)                               │
└───────────────────────────────────────────────────────┘
┌ Route Assistant (orb panel) ──────────────────────────┐
│ ◌ is finding the best route now…   → then:            │
│ 1 ETH = 3,124.09 USDC · Gas ~$0.42 · Impact 0.03 %    │
│ Route: ETH → (v3 0.05%) → USDC                         │
└───────────────────────────────────────────────────────┘
[            Swap             ]   ← white pill, full width
```
**Flow**
1. User types amount → debounce 400 ms → `POST /api/quote` (exact-in or exact-out depending on which field was edited). Refresh quote every 15 s while idle; cancel in-flight on change.
2. Button states (single source of truth function): Connect wallet → Switch network → Select token → Enter amount → Insufficient balance → Insufficient liquidity → Fetching quote… → Approve USDC → Swap → (high impact > 5%) "Swap anyway" in red with confirmation.
3. Approval: check allowance to **Permit2**; if missing, `approve(Permit2, max)` (user can choose exact amount in settings); then sign Permit2 typed data (EIP-712) for the swap.
4. Review modal: amounts, min received (after slippage), price impact, network fee, route, **Byzon fee as its own line** (§7.4). Confirm.
5. Send tx (`sendTransaction` with calldata from `/api/swap`) or for UniswapX orders submit signed order via API.
6. Track: pending toast → confirmed (explorer link, balances refetched, count-up animation on balances) / failed (decoded revert reason) / replaced/speedup handled by viem `waitForTransactionReceipt` replacement callback.
7. Native ETH ↔ WETH handled as wrap/unwrap (direct WETH9 call, no quote).

**Settings popover**: slippage (Auto / 0.1 / 0.5 / 1 / custom, warn > 5 %, block > 50 %), deadline (default 30 min), routing preference (Uniswap API / v2 / v3 / v4 / UniswapX on/off), approval type (exact vs unlimited).

**Token selector**: search by symbol/name/address, common bases chips (ETH, USDC, USDT, WBTC, DAI), user balances sorted first, import unknown token by address with a "not on list — trade at your own risk" warning, persisted imported tokens.

---

## 4. Back-end (BFF) — Next.js route handlers on Vercel

There's no database until Autopilot (Phase 5). The server keeps API keys secret, normalizes responses and caches.

| Route | Upstream | Cache | Notes |
|---|---|---|---|
| `POST /api/quote` | **Uniswap Trading API** `/quote` | none | zod-validated body (chainId, tokenIn/out, amount, type, swapper, slippage); rate-limited per IP |
| `POST /api/approval` | Trading API `/check_approval` | none | |
| `POST /api/swap` | Trading API `/swap` (or `/order` for UniswapX) | none | returns calldata/tx; client never trusts amounts without showing them for review |
| `GET /api/tokens?chainId=` | Uniswap default token list + our curated additions | 1 h (ISR / runtime cache) | |
| `GET /api/prices?ids=&range=` | DefiLlama coins API (prices + chart) — free; CoinGecko as fallback | 60 s (spot) / 5 min (chart) | powers chart, USD values, top tokens table |
| `GET /api/top-tokens?chainId=` | Uniswap subgraph (The Graph, needs key) or DefiLlama | 5 min | volume/TVL |

**Fallback routing (no API key / API down)**: client-side direct quotes via Uniswap **QuoterV2** (v3) on the connected chain for common fee tiers, executed through **SwapRouter02** / **Universal Router** with calldata built by `@uniswap/universal-router-sdk`. Covers single-hop + simple multi-hop; worse prices than the API but keeps the app usable.

**RPC**: Alchemy or Infura per chain (key in env, browser-exposed key restricted by allowed origins) + public fallback via viem `fallback()` transport.

**Autopilot backend (Phase 5)**: this is the only part that needs real state.
| Piece | Choice | Notes |
|---|---|---|
| Order store | Postgres (Neon via Vercel Marketplace) | stores signed orders + Permit2 permits, status, executions. The contract stays the source of truth (cancel/nonce/filled state is read on-chain) |
| API | `POST /api/autopilot/orders` (verify EIP-712 sig server-side before storing), `GET /api/autopilot/orders?owner=`, `DELETE` (soft cancel; on-chain cancel is the real one) |
| Keeper | Node + viem worker on a long-running host (Fly.io/Railway). It watches Chainlink prices every block, executes due orders, and gets swap calldata from the Trading API with `swapper = ByzonAutopilot` | MVP: Vercel Cron every minute. Execution is permissionless, so a third-party keeper can run orders if ours is down |
| Notifications | in-app (Pulse card + activity bell). Email/push later |

**Env vars**: `UNISWAP_API_KEY` (server), `NEXT_PUBLIC_WC_PROJECT_ID`, `NEXT_PUBLIC_RPC_*`, `THE_GRAPH_API_KEY` (server, optional), `DATABASE_URL` + `KEEPER_PRIVATE_KEY` (Phase 5, keeper host only, never on Vercel front-end).

**Observability**: Sentry (client + server), Vercel Analytics; log quote failures and tx reverts with chainId/tokens (never full addresses in analytics).

---

## 5. Supported chains
Mainnets: **Ethereum (1), Polygon PoS (137), Base (8453), Arbitrum One (42161)**. **Default: Base**, because gas is cheapest for first swaps.
Testnets for dev and QA: Sepolia, Polygon Amoy, Base Sepolia, Arbitrum Sepolia. Trading API testnet coverage is still to be confirmed. The main e2e path uses **Anvil forks** of each mainnet, so it runs against real Uniswap, Permit2 and Chainlink contracts with fake balances.
Each chain needs: Universal Router + Permit2 addresses (same Permit2 everywhere), WETH/WPOL, Chainlink feeds for the Autopilot whitelist, and the L2 sequencer-uptime feed (Base, Arbitrum).

---

## 6. Security and UX safety (front-end)
- Show exactly what will be signed; min-received computed client-side and compared against API response (reject if mismatch beyond tolerance).
- Never request unlimited approval silently; Permit2 signatures have short expiry.
- Price-impact gates (warn > 3 %, confirm > 5 %, block > 15 % unless "expert mode").
- Token import warnings; flag fee-on-transfer / honeypot tokens using Uniswap token list tags where available.
- Strict CSP, no third-party scripts besides wallet SDKs; Subresource Integrity where possible.
- Rate limiting on BFF routes (Vercel Firewall / simple IP limiter).
- All amounts as `bigint`; no floating-point math for token values.

---

## 7. Byzon smart contracts (Solidity)

### 7.1 Why these contracts (what makes Byzon different)
Copying Uniswap's AMM would add nothing for users and would split liquidity. Byzon's contracts add **features the Uniswap app doesn't have**, on top of Uniswap's liquidity:

| Feature | User problem it solves | Uniswap app today |
|---|---|---|
| **Autopilot: DCA** | "I want to buy $50 of ETH every week without remembering" | no |
| **Autopilot: Stop-loss / Take-profit / Bracket (OCO)** | "Sell my ARB if it drops 20%, or take profit at +50%, while I sleep" | no (UniswapX limit orders only fill at a price; there's no stop-loss and no oracle protection) |
| **Dust Sweep** | wallets fill up with small leftover balances that cost more gas to sell one by one | no |
| **Basket Buy** | "Put $1,000 into 50% ETH / 30% WBTC / 20% LINK in one click" | no |

The design rules for every contract:
1. **Funds stay in the user's wallet.** Tokens leave the wallet only during the transaction that executes the swap, through a **Permit2** allowance with a cap and an expiry. Byzon contracts never hold user balances between transactions.
2. **No new liquidity.** Swaps go through Uniswap's **Universal Router**.
3. **The contract checks the route, not the keeper.** Every execution enforces `minOut` from a **Chainlink** oracle price, so a malicious or buggy keeper/route can't hand the user a bad fill.
4. **Fees can't be raised past a hard cap.** `MAX_FEE_BPS` is a constant in the code. The owner (a Safe multisig) can only adjust fees below it.
5. **No upgrade proxies.** New versions are new deployments, so users always know what code they approved.

### 7.2 `ByzonRouter`: every in-app swap
- `swap(SwapParams p, bytes uniCalldata, PermitData permit)`
  1. Pulls `amountIn` from the user via Permit2 (`permitTransferFrom`, signature transfer, single use).
  2. Takes the **fee on the input** (`amountIn × feeBps`) and sends it to `feeRecipient`. Quotes are requested for the net amount, so the receive amount the UI shows is exactly what the user gets.
  3. Calls Universal Router with calldata from the Trading API, quoted with `swapper = ByzonRouter` and `recipient = user`.
  4. Measures the recipient's output balance delta and checks `>= minOut`; otherwise it reverts.
  5. Native ETH/POL in and out is supported (wrap/unwrap inside).
- `sweep(SweepParams p, bytes[] uniCalldata, PermitBatchData permit)`: **Dust Sweep**. Takes N tokens into 1 output with one Permit2 batch signature and one transaction. Each leg has its own `minOut`. Legs that would fail are skipped (`try/catch`) instead of reverting the whole sweep, and skipped tokens are returned.
- `basket(BasketParams p, bytes[] uniCalldata, PermitData permit)`: **Basket Buy**. Takes 1 input into N outputs by weight, with `minOut` per output.
- Optional `referrer` in params: that address accrues 20% of the fee, claimable through `claim()`. This is the growth lever.
- Safety: `nonReentrant`; an invariant that the contract's token balance is 0 after each call; Universal Router address immutable per chain; `rescue()` only for tokens sent to the contract by mistake.

### 7.3 `ByzonAutopilot`: DCA, limit, stop-loss and take-profit orders where funds stay in the wallet
**Order** (signed EIP-712, ERC-1271 supported for smart-contract wallets like Safe):
```solidity
struct Order {
  address owner;
  address tokenIn; address tokenOut;
  uint8   kind;          // DCA | LIMIT | STOP_LOSS | TAKE_PROFIT
  uint256 amountPerExec; // tranche size
  uint32  execsTotal;    // 1 for limit/stop, N for DCA
  uint32  interval;      // DCA seconds between execs
  uint256 triggerPrice;  // 1e18-scaled tokenOut per tokenIn (oracle units); 0 for DCA
  uint16  maxSlippageBps;// vs oracle price
  uint64  validUntil;
  uint256 nonce;
  bytes32 ocoGroup;      // bracket orders: first to fill cancels the group
}
```
**Setup (one time per order):** the user signs (1) the `Order` and (2) a Permit2 **AllowanceTransfer** permit for `amountPerExec × execsTotal`, expiring at `validUntil`. **No funds move at signing.** In total that's two signatures and zero transactions, unless the token has never been approved to Permit2.

**Execution:** `execute(Order o, bytes sig, bytes uniCalldata)` is **permissionless**; Byzon runs a keeper, and anyone else can too.
1. Verify the signature, check it's not cancelled or expired, and check `execsDone < execsTotal`. For DCA, check `block.timestamp >= lastExec + interval`. For OCO, check the group is still open.
2. Read the **Chainlink** price for tokenIn/tokenOut (two USD feeds composed when there's no direct feed). Check staleness (`updatedAt` within the feed heartbeat) and the **L2 sequencer-uptime feed** on Base and Arbitrum.
3. Check the trigger: `LIMIT`/`TAKE_PROFIT` → price ≥ trigger; `STOP_LOSS` → price ≤ trigger.
4. Pull the tranche through Permit2, take the fee, swap through Universal Router, and enforce `out >= oracleQuote × (1 − maxSlippageBps)`.
5. Pay the executor a **tip** from the fee, so third-party keepers have a reason to run orders. Emit `Executed(orderHash, in, out, price)`.

**Cancel:** `cancel(orderHash)`, or `invalidateNonces()` to kill all orders at once; revoking the Permit2 allowance also works.
**Token scope:** only tokens with Chainlink feeds on that chain (a whitelist per chain, set by the owner). That covers the majors: ETH, WBTC, USDC, USDT, DAI, LINK, ARB, POL, UNI, AAVE, etc.

**Front-end (Autopilot page + "Swap | Autopilot" toggle on the swap card):**
- order builder: kind tabs (DCA / Limit / Stop-loss / Take-profit / Bracket), trigger set by dragging a line on the pair chart, preview "≈ you receive" at the trigger price
- active-orders table (progress ring for DCA)
- history
- one-click cancel

### 7.4 Fees (Byzon revenue)
| Action | Fee | Rationale |
|---|---|---|
| Standard swap | **0.20%** | below the 0.25% interface fee charged by Uniswap Labs' own app and far below MetaMask Swaps (0.875%). Competitive, still meaningful revenue |
| Stable ↔ stable (USDC/USDT/DAI…) | **0.05%** | stables are price-sensitive; matches the cheapest tier |
| Wrap / unwrap (ETH ↔ WETH, POL ↔ WPOL) | **0%** | not a real trade |
| Dust Sweep / Basket Buy | **0.20%** per leg | same as swaps |
| Autopilot execution | **0.35%** per execution (executor tip comes out of this) | covers keeper gas on L2s and is still far cheaper than CEX recurring-buy fees (~1.5%+) |
| Hard cap in code | `MAX_FEE_BPS = 50` (0.5%) | public trust guarantee |

Ethereum mainnet: minimum Autopilot tranche **$250**, because keeper gas makes small DCA tranches uneconomical there. L2s and Polygon have a **$10** minimum.
For scale: $1M/day of swap volume at 0.20% is about $2k/day, and 20% of that goes to referrers when a referrer is set.
UI: the fee is always shown as its own line in the review modal ("Byzon fee 0.20% · $2.50"), never hidden inside the price.

### 7.5 Contract engineering
- **Foundry** monorepo package `contracts/`. Solidity `0.8.x`, OpenZeppelin (`ReentrancyGuard`, `EIP712`, `SignatureChecker`, `SafeERC20`), Uniswap `permit2` interfaces, Chainlink `AggregatorV3Interface`.
- Tests:
  - unit tests
  - **fork tests** against real Universal Router, Permit2 and Chainlink on all 4 chains
  - **fuzzing** of amounts, fees and slippage
  - **invariant tests**: router balance always 0; no execution below the oracle bound; DCA never exceeds `execsTotal`; fee ≤ cap
- Static analysis: Slither + Aderyn in CI. Gas snapshots.
- Deploy with `forge script` and **CREATE2** at the same address on every chain. Verified on Etherscan, Polygonscan, Basescan and Arbiscan. Owner and `feeRecipient` = **Safe multisig**.
- Generated TypeScript ABIs (`wagmi cli` + Foundry plugin) are consumed by the front-end, so types are shared end to end.
- **External audit before mainnet.** Launch order: ByzonRouter first (simpler, unlocks fees), then Autopilot.
- To verify when the API key arrives: the Trading API must return Universal Router calldata for `swapper = <contract>` (classic routes only; UniswapX orders can't be wrapped). If it can't, we build the calldata ourselves with `@uniswap/universal-router-sdk` from the API's route.

---

## 8. Delivery plan

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Foundation** (2–3 d) | Next.js scaffold, Tailwind tokens, fonts, icon set, app shell (rail, header, columns, dividers), card primitives, motion primitives (Stagger, CountUp), lint/format/test setup, Vercel preview | Static shell pixel-compared side-by-side with the reference frames |
| **1. Wallet** (3–4 d) ← **first focus** | wagmi config, custom connect modal (injected/6963, MetaMask, WalletConnect QR + mobile deep links, Coinbase), wallet pill + account menu, network pill + switching, wrong-network banner, ENS, SSR cookie state | All §3.3 acceptance criteria pass on desktop + iOS + Android |
| **2. Swap** (5–7 d) | BFF routes, token list + selector, quote flow, Route Assistant panel + orb, approvals/Permit2, review modal, tx tracking + activity bell, settings, wrap/unwrap, QuoterV2 fallback | Real swaps on Base mainnet with small amounts + e2e on Anvil fork |
| **3. Data & polish** (4–5 d) | Pair chart w/ ranges + tooltip, holdings carousel, top-tokens table w/ sparklines + "Swap → Selected" morph, intro sequence, responsive layouts, a11y pass, perf budget (LCP < 2.5 s, 3D lazy) | Design review vs reference; Lighthouse ≥ 90 perf/a11y |
| **4. ByzonRouter** (1–1.5 wk + audit) | contract + Foundry tests, CREATE2 deploy on testnets, then on forks. The front-end switches swaps to the router, adds the fee line, Dust Sweep (Pulse card) and Basket Buy | Fork tests green on 4 chains, audit booked |
| **5. Autopilot** (2–3 wk + audit) | contract, order DB + API, keeper, Autopilot page + chart trigger drag, Pulse "order fired" slide | DCA + stop-loss run end-to-end on a fork and a testnet |
| **6. Launch** | audit fixes, Sentry, analytics, legal pages (terms, risk disclaimer, fee disclosure), production deploy | Your explicit approval |

Contract work (Phases 4–5) can start in parallel with Phases 2–3 once Phase 1 is done, because they only share the ABI package. Until ByzonRouter is live, swaps go straight to Uniswap with no Byzon fee.

---

## 9. Testing strategy
- **Unit**: button-state machine, amount parsing/formatting, slippage math, min-received, token search.
- **Integration**: BFF routes with recorded upstream fixtures (zod schemas catch API drift).
- **E2E (Playwright)**: injected mock EIP-1193 provider pointing at an **Anvil fork** (Base) with a funded test account → connect, quote, approve, swap, verify balance changes.
- **Manual matrix**: MetaMask ext, Rabby, MetaMask Mobile via WC, Rainbow via WC, Coinbase Wallet; Chrome/Safari/Firefox; iOS/Android.
- **Visual**: Playwright screenshots of key states compared to the reference frames.
- **Contracts**: see §7.5 (Foundry unit + fork + fuzz + invariant tests, Slither/Aderyn, external audit).

---

## 10. Out of scope / later
LP positions UI, cross-chain swaps, fiat on-ramp, SIWE accounts, email/push notifications, i18n, admin dashboard, Byzon token/governance, our own AMM.

---

## 11. Decisions log (2026-11-04)
| # | Topic | Decision |
|---|---|---|
| 1 | Name / logo | **Byzon**. Z-cut coin mark designed in code (`brand/`, §2.7) |
| 2 | Language | English |
| 3 | Chains | Ethereum, Polygon, Base, Arbitrum. Default Base |
| 4 | Liquidity / contracts | Uniswap Trading API for routing. Own Solidity contracts: ByzonRouter + ByzonAutopilot (§7) |
| 5 | Fees | 0.20% standard, 0.05% stables, 0% wrap, 0.35% Autopilot, 0.5% hard cap (§7.4) |
| 6 | Promo card | Byzon Pulse smart card (§2.8) |
| 7 | Keys | provided later. Phase 0–1 run with placeholders; WalletConnect needs `NEXT_PUBLIC_WC_PROJECT_ID` before its QR flow can be tested |
| 8 | Orb | built in code (R3F procedural, §2.6) |
| 9 | Brand scope | Byzon (swap) is a **new, standalone brand**, unrelated to the Hyperliquid trading bot of the same name. Keep the blue accent from the reference video. Share nothing (tokens, logo, wordmark) with the bot's black+green system |

**Still open (not blocking Phase 0–1):**
- Confirm Trading API behavior with `swapper = contract` once the key arrives (§7.5).
- Keeper hosting (Fly.io vs Railway) at Phase 5.
- Legal review of the fee disclosure and terms before launch.
