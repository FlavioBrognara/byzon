"use client";

import { motion, useAnimationControls, type Variants } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";
import { Header, Rail, TabBar, WrongNetworkBanner } from "@/components/shell/Shell";
import { ConnectModal } from "@/components/wallet/ConnectModal";
import { PairChart } from "@/components/cards/PairChart";
import { Holdings } from "@/components/cards/Holdings";
import { SwapCard } from "@/components/cards/SwapCard";
import { PulseCard } from "@/components/cards/PulseCard";
import { TopTokens } from "@/components/cards/TopTokens";
import { fadeUp } from "@/components/ui/primitives";

const INTRO_KEY = "byzon:intro-seen";
const EASE = [0.16, 1, 0.3, 1] as const;
let introCache: boolean | undefined;
let introMounted = false;

/** Play the zoom-out intro once per session, on tablet+ and only without reduced motion. */
function readIntro() {
  if (introMounted) return false;
  if (introCache !== undefined) return introCache;
  try {
    introCache = !sessionStorage.getItem(INTRO_KEY) && matchMedia("(min-width: 768px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    introCache = false;
  }
  return introCache;
}
const noop = () => () => {};

// Intro: the swap card sits alone, zoomed in; the page pulls back to 1×, then the other cards slide in from the sides.
const stage: Variants = {
  from: { scale: 1.6 },
  in: { scale: 1, transition: { delay: 1.2, duration: 1.3, ease: EASE } },
  now: { scale: 1, transition: { duration: 0 } },
};
const side = (dx: number, k: number): Variants => ({
  from: { opacity: 0, x: dx, filter: "blur(8px)" },
  in: { opacity: 1, x: 0, filter: "blur(0px)", transition: { delay: 2 + k * 0.12, duration: 0.8, ease: EASE } },
  now: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0 } },
});
const hero: Variants = {
  from: { opacity: 0, filter: "blur(8px)" },
  in: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
  now: { opacity: 1, filter: "blur(0px)", transition: { duration: 0 } },
};

export function Dashboard() {
  const play = useSyncExternalStore(noop, readIntro, () => false);
  // Imperative controls: a declarative "now" target equal to "in" wouldn't interrupt the running intro.
  const controls = useAnimationControls();
  // A later Dashboard mount in the same JS session must not replay the intro.
  useEffect(() => () => {
    if (introCache) introMounted = true;
  }, []);

  useEffect(() => {
    if (!play) return;
    controls.start("in");
    const skip = () => {
      controls.stop();
      controls.start("now");
    };
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [play, controls]);

  // Without the intro every card uses the normal staggered fade-up.
  const anim = (v: Variants, n: number) => (play ? { variants: v } : fadeUp(n));

  return (
    <div className="flex min-h-dvh bg-app">
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <h1 className="sr-only">Byzon: swap tokens on Ethereum, Base, Arbitrum and Polygon</h1>
        <Header />
        <WrongNetworkBanner />
        <motion.main
          key={String(play)}
          {...(play ? { variants: stage, initial: "from", animate: controls, style: { transformOrigin: "68% 22%" } } : {})}
          className="grid flex-1 grid-cols-1 grid-cols-[minmax(0,1fr)] pb-16 md:pb-0 xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,2fr)]"
        >
          <div className="order-2 flex flex-col gap-4 border-line p-4 md:p-6 xl:order-1 xl:border-r">
            <motion.div {...anim(side(-80, 0), 2)}>
              <PairChart />
            </motion.div>
            <motion.div {...anim(side(-80, 1), 4)}>
              <Holdings />
            </motion.div>
          </div>
          <div className="order-1 flex min-w-0 flex-col gap-4 p-4 md:p-6 xl:order-2">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,1fr)]">
              {/* Hero card lands first and settles from a slight zoom, echoing the reference intro. */}
              <motion.div
                {...(play
                  ? { variants: hero }
                  : { initial: { opacity: 0, scale: 1.06, filter: "blur(8px)" }, animate: { opacity: 1, scale: 1, filter: "blur(0px)" }, transition: { duration: 0.7, ease: EASE } })}
                className="flex"
              >
                <SwapCard />
              </motion.div>
              <motion.div {...anim(side(80, 0), 3)} className="flex flex-col lg:pt-[68px]">
                <PulseCard />
              </motion.div>
            </div>
            <motion.div {...anim(side(80, 2), 5)}>
              <TopTokens />
            </motion.div>
          </div>
        </motion.main>
      </div>
      <TabBar />
      <ConnectModal />
    </div>
  );
}
