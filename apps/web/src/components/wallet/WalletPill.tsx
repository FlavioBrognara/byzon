"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Copy, ExternalLink, LogOut, Repeat } from "lucide-react";
import { useMemo } from "react";
import { useConnection, useEnsAvatar, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { normalize } from "viem/ens";
import { CHAIN_META } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { useActiveChain, useDisconnectAll, useMounted } from "@/lib/hooks";
import { useUI } from "@/stores/ui";

/** Deterministic two-tone avatar from the address (blockie stand-in). */
function Avatar({ address, src }: { address: string; src?: string | null }) {
  const h1 = parseInt(address.slice(2, 8), 16) % 360;
  const h2 = (h1 + 90 + (parseInt(address.slice(8, 12), 16) % 120)) % 360;
  return (
    <span
      className="block size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10"
      style={{ background: `conic-gradient(from 210deg, hsl(${h1} 80% 55%), hsl(${h2} 80% 50%), hsl(${h1} 80% 55%))` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ENS avatars come from arbitrary hosts */}
      {src && <img src={src} alt="" className="size-full object-cover" />}
    </span>
  );
}

export function WalletPill() {
  const mounted = useMounted();
  const { address, status, connector } = useConnection();
  const disconnectAll = useDisconnectAll();
  const setConnectOpen = useUI((s) => s.setConnectOpen);
  const { chainId } = useActiveChain();
  const { data: ens } = useEnsName({ address, chainId: mainnet.id, query: { enabled: !!address } });
  const ensName = useMemo(() => {
    try {
      return ens ? normalize(ens) : undefined;
    } catch {
      return undefined; // name that fails UTS-46 normalization: skip the avatar
    }
  }, [ens]);
  const { data: avatar } = useEnsAvatar({ name: ensName, chainId: mainnet.id, query: { enabled: !!ensName } });

  // Same footprint as the connected pill so the header never shifts while wagmi reconnects.
  if (!mounted || status === "reconnecting")
    return <div className="h-11 w-[120px] shrink-0 animate-pulse sm:w-[168px] rounded-full bg-white/[0.04]" aria-hidden />;

  if (!address)
    return (
      <button onClick={() => setConnectOpen(true)} className="pill-white h-11 w-[120px] shrink-0 whitespace-nowrap text-sm sm:w-[168px]">
        Connect wallet
      </button>
    );

  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-11 items-center gap-2.5 rounded-full pr-2 text-left outline-none" aria-label="Account menu">
        <Avatar address={address} src={avatar} />
        <span className="hidden min-w-0 sm:block">
          <span className="flex items-center gap-1 text-sm font-medium">
            {ens ?? shortAddress(address)} <ChevronDown className="size-3.5 text-t2" />
          </span>
          <span className="block text-xs text-t3">{ens ? shortAddress(address) : connector?.name}</span>
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={10} className="card-glass z-50 min-w-[220px] p-1.5 text-sm">
          <MenuItem onSelect={() => navigator.clipboard.writeText(address)} icon={<Copy className="size-4" />}>
            Copy address
          </MenuItem>
          <MenuItem
            onSelect={() => window.open(`${CHAIN_META[chainId].explorer}/address/${address}`, "_blank", "noopener")}
            icon={<ExternalLink className="size-4" />}
          >
            View on {CHAIN_META[chainId].name} explorer
          </MenuItem>
          <MenuItem onSelect={() => setConnectOpen(true)} icon={<Repeat className="size-4" />}>
            Switch wallet
          </MenuItem>
          <Menu.Separator className="my-1 h-px bg-line" />
          <MenuItem onSelect={disconnectAll} icon={<LogOut className="size-4" />} danger>
            Disconnect
          </MenuItem>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function MenuItem({ children, icon, onSelect, danger }: { children: React.ReactNode; icon: React.ReactNode; onSelect: () => void; danger?: boolean }) {
  return (
    <Menu.Item
      onSelect={onSelect}
      className={`relative flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 outline-none data-[highlighted]:bg-white/[0.06] ${danger ? "text-negative" : "text-t1"}`}
    >
      <span className="text-t2">{icon}</span>
      {children}
    </Menu.Item>
  );
}
