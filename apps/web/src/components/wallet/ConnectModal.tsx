"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Copy, Loader2, ShieldCheck, Wallet, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConnect, useConnection, useConnections, useConnectors, useDisconnect, type Connector } from "wagmi";
import { useUI } from "@/stores/ui";
import { ByzonMark, TokenBadge } from "@/components/ui/primitives";
import { orderConnectors } from "@/lib/connectors";

type Phase =
  | { kind: "intro" }
  | { kind: "connecting"; connector: Connector }
  | { kind: "qr"; connector: Connector; uri: string }
  | { kind: "error"; connector: Connector; message: string; rejected: boolean };

const BRAND: Record<string, { color: string; hint: string }> = {
  metaMaskSDK: { color: "#F6851B", hint: "Extension or mobile app" },
  metaMask: { color: "#F6851B", hint: "Extension or mobile app" },
  walletConnect: { color: "#3B99FC", hint: "Scan with any mobile wallet" },
  coinbaseWalletSDK: { color: "#0052FF", hint: "Coinbase Wallet & Smart Wallet" },
};

const isRejection = (e: unknown) => {
  const err = e as { name?: string; code?: number; cause?: { code?: number } };
  return err?.name === "UserRejectedRequestError" || err?.code === 4001 || err?.cause?.code === 4001;
};

export function ConnectModal() {
  const open = useUI((s) => s.connectOpen);
  const setOpen = useUI((s) => s.setConnectOpen);
  const connectors = useConnectors();
  const { mutateAsync: connect } = useConnect();
  const { connector: current } = useConnection();
  const connections = useConnections();
  const { mutate: disconnect } = useDisconnect();
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const attempt = useRef(0);
  const seenRdns = useAnnouncedRdns(open);
  const list = useMemo(() => orderConnectors(connectors, seenRdns), [connectors, seenRdns]);

  const onOpenChange = (o: boolean) => {
    if (!o) {
      attempt.current++; // late results from an abandoned attempt are ignored
      setPhase({ kind: "intro" });
    }
    setOpen(o);
  };

  async function start(connector: Connector) {
    if (current?.uid === connector.uid) return onOpenChange(false);
    const id = ++attempt.current;
    setPhase({ kind: "connecting", connector });
    // WalletConnect / MetaMask mobile emit the pairing URI; we render it as our own QR.
    const onMessage = ({ type, data }: { type: string; data?: unknown }) => {
      if (id === attempt.current && type === "display_uri" && typeof data === "string") setPhase({ kind: "qr", connector, uri: data });
    };
    connector.emitter.on("message", onMessage);
    try {
      await connect({ connector });
      if (id !== attempt.current) {
        disconnect({ connector }); // user moved on; don't let a stale approval take over
        return;
      }
      // Switching wallets: wagmi keeps the old connection alive, so drop it.
      connections.forEach((c) => c.connector.uid !== connector.uid && disconnect({ connector: c.connector }));
      onOpenChange(false);
    } catch (e) {
      if (id !== attempt.current) return;
      const rejected = isRejection(e);
      const message = rejected
        ? "Request was rejected in the wallet."
        : ((e as { shortMessage?: string; message?: string }).shortMessage ?? (e as Error).message ?? "Connection failed.");
      setPhase({ kind: "error", connector, message, rejected });
    } finally {
      connector.emitter.off("message", onMessage);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="card-glass fixed left-1/2 top-1/2 z-50 grid w-[min(720px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 grid-cols-1 md:grid-cols-[280px_1fr]"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative border-b border-line p-5 md:border-b-0 md:border-r">
                  <Dialog.Title className="text-lg font-semibold">Connect wallet</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-t3">Choose how you want to connect.</Dialog.Description>
                  <ul className="mt-5 flex flex-col gap-1.5">
                    {list.map((c) => {
                      const brand = BRAND[c.id] ?? BRAND[c.type];
                      const active = phase.kind !== "intro" && phase.connector.uid === c.uid;
                      return (
                        <li key={c.uid}>
                          <button
                            onClick={() => start(connectors.find((x) => x.uid === c.uid)!)}
                            disabled={phase.kind === "connecting"}
                            data-active={active}
                            className="flex w-full items-center gap-3 rounded-[14px] border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60 data-[active=true]:border-line-strong data-[active=true]:bg-white/[0.06]"
                          >
                            {c.icon ? (
                              // eslint-disable-next-line @next/next/no-img-element -- EIP-6963 icons are data: URIs
                              <img src={c.icon} alt="" className="size-8 rounded-[10px]" />
                            ) : (
                              <TokenBadge symbol={c.name} color={brand?.color ?? "#2F7BF6"} size={32} />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{c.name}</span>
                              {brand && !c.detected && <span className="block truncate text-xs text-t3">{brand.hint}</span>}
                            </span>
                            {c.detected && (
                              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">Detected</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {!list.some((c) => c.type === "walletConnect") && (
                    <p className="mt-4 text-xs text-t3">WalletConnect turns on once a project id is configured.</p>
                  )}
                </div>

                <div className="relative flex min-h-[340px] flex-col items-center justify-center p-6 text-center">
                  <Dialog.Close className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-t2 hover:bg-white/5 hover:text-white" aria-label="Close">
                    <X className="size-4" strokeWidth={1.75} />
                  </Dialog.Close>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phase.kind}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex w-full flex-col items-center"
                    >
                      <PhaseView phase={phase} retry={() => phase.kind !== "intro" && start(phase.connector)} back={() => setPhase({ kind: "intro" })} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function PhaseView({ phase, retry, back }: { phase: Phase; retry: () => void; back: () => void }) {
  if (phase.kind === "intro")
    return (
      <>
        <div className="relative mb-5 grid size-20 place-items-center rounded-full bg-[radial-gradient(circle,rgba(47,123,246,.35),transparent_70%)]">
          <ByzonMark size={44} />
        </div>
        <h3 className="text-base font-semibold">What is a wallet?</h3>
        <p className="mt-2 max-w-[300px] text-sm text-t2">
          A wallet holds your tokens and signs transactions. Byzon never takes custody: every swap is approved by you, in your wallet.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-t3">
          <ShieldCheck className="size-4" strokeWidth={1.75} /> No sign-up. No email. Just your wallet.
        </div>
      </>
    );
  if (phase.kind === "connecting")
    return (
      <>
        <Loader2 className="mb-4 size-9 animate-spin text-accent" strokeWidth={1.5} />
        <h3 className="text-base font-semibold">Opening {phase.connector.name}</h3>
        <p className="mt-2 text-sm text-t2">Confirm the connection in your wallet.</p>
      </>
    );
  if (phase.kind === "qr") return <QrView uri={phase.uri} name={phase.connector.name} />;
  return (
    <>
      <div className={`mb-4 grid size-12 place-items-center rounded-full ${phase.rejected ? "bg-white/5 text-t2" : "bg-negative/15 text-negative"}`}>
        <Wallet className="size-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold">{phase.rejected ? "Connection cancelled" : "Couldn't connect"}</h3>
      <p className="mt-2 max-w-[300px] break-words text-sm text-t2">{phase.message}</p>
      <div className="mt-5 flex gap-2">
        <button onClick={back} className="flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm text-t2 hover:text-white">
          <ArrowLeft className="size-4" strokeWidth={1.75} /> Back
        </button>
        <button onClick={retry} className="pill-white px-5 py-2 text-sm">
          Try again
        </button>
      </div>
    </>
  );
}

function QrView({ uri, name }: { uri: string; name: string }) {
  const [src, setSrc] = useState<string>();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(uri, { margin: 1, width: 440, color: { dark: "#000000", light: "#ffffff" }, errorCorrectionLevel: "M" }).then(setSrc);
  }, [uri]);
  return (
    <>
      <h3 className="mb-4 text-base font-semibold">Scan with {name === "WalletConnect" ? "your phone" : name}</h3>
      <div className="rounded-[18px] bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URI */}
        {src ? <img src={src} alt="WalletConnect QR code" className="size-[220px]" /> : <div className="size-[220px]" />}
      </div>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(uri);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="mt-4 flex items-center gap-1.5 text-sm text-t2 hover:text-white"
      >
        {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" strokeWidth={1.75} />} {copied ? "Copied" : "Copy link"}
      </button>
      {/* On a phone the QR can't be scanned by the same device: open the wallet app directly. */}
      <a href={uri} className="pill-white mt-3 px-5 py-2 text-sm md:hidden">
        Open in {name}
      </a>
    </>
  );
}

/** rdns of every EIP-6963 wallet on the page (wagmi hides the ones that match its own connectors). */
function useAnnouncedRdns(active: boolean) {
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (!active) return;
    const onAnnounce = (e: Event) => {
      const rdns = (e as CustomEvent<{ info?: { rdns?: string } }>).detail?.info?.rdns;
      if (rdns) setSeen((s) => (s.has(rdns) ? s : new Set([...s, rdns])));
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, [active]);
  return seen;
}
