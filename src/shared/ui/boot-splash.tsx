"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { ConsoleTitleBar } from "./overlays/console";

const BOOT: string[] = [
  "NOT LAZY BIOS v2.0 — (c) sloth systems",
  "POST ............................ MEM OK",
  "MOUNT /sloth ........................ OK",
  "LOAD masthead ....................... OK",
];

type Phase = "boot" | "masthead";

/** Run `fn` inside a view transition when supported, else just run it. */
function withViewTransition(fn: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  if (
    typeof doc.startViewTransition === "function" &&
    !prefersReducedMotion()
  ) {
    doc.startViewTransition(fn);
  } else {
    fn();
  }
}

/**
 * Boot-to-blog splash — a short boot log that, on completion, view-transition-
 * morphs into the masthead (a shared `view-transition-name` ties the boot panel
 * to the masthead). Square 2px chrome, accent caret. LAB-only. Falls back to a
 * plain cut where View Transitions are unsupported. Reduced motion: skips the
 * boot animation and the morph — renders the masthead directly (with a Replay).
 */
export function BootSplash({ className = "" }: { className?: string }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const [phase, setPhase] = useState<Phase>("boot");
  const [shown, setShown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const toMasthead = useCallback(() => {
    withViewTransition(() => setPhase("masthead"));
  }, []);

  // ONE boot runner — types the log, then morphs to the masthead. Shared by the
  // first scroll-in run and the Replay button (no copy-pasted interval).
  const startBoot = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setShown(0);
    if (prefersReducedMotion()) {
      setShown(BOOT.length);
      setPhase("masthead");
      return;
    }
    timer.current = setInterval(() => {
      setShown((n) => {
        if (n >= BOOT.length) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          setTimeout(toMasthead, 420); // hold on the full log, then morph
          return n;
        }
        return n + 1;
      });
    }, 300);
  }, [toMasthead]);

  useEffect(() => {
    if (!inView) return;
    const raf = requestAnimationFrame(startBoot);
    return () => {
      cancelAnimationFrame(raf);
      if (timer.current) clearInterval(timer.current);
    };
  }, [inView, startBoot]);

  const replay = () => {
    withViewTransition(() => setPhase("boot"));
    requestAnimationFrame(startBoot);
  };

  return (
    <div ref={ref} className={className}>
      {phase === "boot" ? (
        <div
          className="border-2 border-[var(--m-dim)] bg-[#0d0d0d]"
          style={{ viewTransitionName: "boot-splash" }}
        >
          <ConsoleTitleBar title="boot ~ /dev/blog0" />
          <div className="min-h-[180px] p-5 text-[14px] leading-[1.6]">
            {BOOT.slice(0, shown).map((line, i) => (
              <div
                key={i}
                className={
                  i === BOOT.length - 1
                    ? "text-[var(--m-accent)]"
                    : "text-[var(--m-muted)]"
                }
              >
                {line}
              </div>
            ))}
            {shown < BOOT.length ? (
              <span className="mono-caret" aria-hidden="true" />
            ) : null}
          </div>
        </div>
      ) : (
        <div
          className="flex min-h-[180px] flex-col items-start justify-center border-2 border-[var(--m-accent)] bg-[var(--m-card)] p-10"
          style={{ viewTransitionName: "boot-splash" }}
        >
          <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
            {"// SYSTEM READY"}
          </div>
          <h2 className="font-display mt-4 flex items-center text-[40px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]">
            STAY LAZY
            <span className="mono-caret" aria-hidden="true" />
          </h2>
          <button
            type="button"
            onClick={replay}
            className="mt-6 text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)]"
          >
            ↺ Replay boot
          </button>
        </div>
      )}
    </div>
  );
}
