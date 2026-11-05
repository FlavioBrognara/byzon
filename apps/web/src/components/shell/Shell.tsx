"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeftRight, Bell, ChevronDown, ChevronLeft, ChevronRight, Compass, History, LogOut, PieChart, Search, Settings, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { CHAIN_META, DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/lib/chains";
import { useActiveChain, useDisconnectAll, useIsConnected, useMounted } from "@/lib/hooks";
import { ByzonMark, ChainDot } from "@/components/ui/primitives";
import { WalletPill } from "@/components/wallet/WalletPill";

const NAV = [
  { label: "Swap", icon: ArrowLeftRight, active: true },
  { label: "Autopilot", icon: Zap },
  { label: "Explore", icon: Compass },
  { label: "Portfolio", icon: PieChart },
  { label: "Activity", icon: History },
];

export function Rail() {
  const connected = useIsConnected();
  const disconnectAll = useDisconnectAll();
  return (
    <nav aria-label="Main" className="hidden w-[72px] shrink-0 flex-col items-center border-r border-line py-5 md:flex">
      <div className="mb-8 grid h-11 place-items-center">
        <ByzonMark size={34} />
      </div>
      <ul className="flex flex-col gap-2">
        {NAV.map(({ label, icon: Icon, active }) => (
          <li key={label}>
            <button
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={active ? label : `${label} — coming soon`}
              className="grid size-10 place-items-center rounded-[12px] text-t3 transition-colors hover:bg-white/5 hover:text-white aria-[current=page]:bg-s4 aria-[current=page]:text-white"
            >
              <Icon className="size-[18px]" strokeWidth={1.6} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2">
        <button aria-label="Settings" className="grid size-10 place-items-center rounded-[12px] text-t3 hover:bg-white/5 hover:text-white">
          <Settings className="size-[18px]" strokeWidth={1.6} />
        </button>
        <button
          aria-label="Disconnect wallet"
          disabled={!connected}
          onClick={disconnectAll}
          className="grid size-10 place-items-center rounded-[12px] text-t3 hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <LogOut className="size-[18px]" strokeWidth={1.6} />
        </button>
      </div>
    </nav>
  );
}

export function TabBar() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-app/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-5">
        {NAV.map(({ label, icon: Icon, active }) => (
          <li key={label}>
            <button
              aria-current={active ? "page" : undefined}
              aria-disabled={!active}
              aria-label={active ? label : `${label}, coming soon`}
              className="flex h-14 w-full flex-col items-center justify-center gap-1 text-[11px] text-t3 aria-disabled:opacity-50 aria-[current=page]:text-white"
            >
              <Icon className="size-[18px]" strokeWidth={1.6} />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SearchBox() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <label className="hidden h-11 w-full max-w-[340px] items-center gap-2.5 rounded-full border border-line bg-s2 pl-4 pr-1.5 text-sm lg:flex">
      <Search className="size-4 text-t2" strokeWidth={1.75} />
      <input ref={ref} placeholder="Search tokens or paste address" aria-label="Search tokens" className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-t3" />
      <kbd className="rounded-full bg-s4 px-2.5 py-1 text-[11px] text-t2">⌘K</kbd>
    </label>
  );
}

function NetworkPill() {
  const mounted = useMounted();
  const { chainId, select, switching } = useActiveChain();
  const id = mounted ? chainId : DEFAULT_CHAIN.id;
  const idx = SUPPORTED_CHAINS.findIndex((c) => c.id === id);
  const step = (d: number) => select(SUPPORTED_CHAINS[(idx + d + SUPPORTED_CHAINS.length) % SUPPORTED_CHAINS.length].id);
  return (
    <div className="flex h-11 items-center gap-1 rounded-full border border-line bg-s2 px-1.5" aria-label="Network">
      <button onClick={() => step(-1)} aria-label="Previous network" className="grid size-8 place-items-center rounded-full text-t2 hover:bg-white/5 hover:text-white">
        <ChevronLeft className="size-4" strokeWidth={1.75} />
      </button>
      <span className="flex items-center justify-center gap-2 text-sm sm:w-[104px]" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: switching ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2"
          >
            <ChainDot chainId={id} size={18} />
            <span className="sr-only sm:not-sr-only">{CHAIN_META[id].name}</span>
          </motion.span>
        </AnimatePresence>
      </span>
      <button onClick={() => step(1)} aria-label="Next network" className="grid size-8 place-items-center rounded-full text-t2 hover:bg-white/5 hover:text-white">
        <ChevronRight className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <ByzonMark size={28} />
      </div>
      <button className="hidden items-center gap-2 text-[15px] font-medium sm:flex">
        Swap <ChevronDown className="size-4 text-t2" strokeWidth={1.75} />
      </button>
      <div className="flex flex-1 justify-center">
        <SearchBox />
      </div>
      <button className="hidden h-11 items-center gap-2 rounded-full border border-line bg-s2 px-4 text-sm sm:flex" aria-label="Activity">
        <Bell className="size-4" strokeWidth={1.75} />
        <span className="text-t2">All clear</span>
      </button>
      <NetworkPill />
      <WalletPill />
    </header>
  );
}

export function WrongNetworkBanner() {
  const { wrongNetwork, select, switching } = useActiveChain();
  return (
    <AnimatePresence>
      {wrongNetwork && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-line bg-negative/10"
          role="alert"
        >
          <div className="flex items-center gap-3 px-6 py-2.5 text-sm">
            <AlertTriangle className="size-4 text-negative" strokeWidth={1.75} />
            <span className="flex-1">Your wallet is on a network Byzon doesn&apos;t support.</span>
            <button disabled={switching} onClick={() => select(DEFAULT_CHAIN.id)} className="pill-white px-4 py-1.5 text-xs disabled:opacity-60">
              {switching ? "Switching…" : `Switch to ${CHAIN_META[DEFAULT_CHAIN.id].name}`}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
