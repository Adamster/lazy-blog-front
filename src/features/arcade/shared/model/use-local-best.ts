"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Signed-out BEST — the max of the game's localStorage run log (the same log the
 * sparkline reads). (Re)hydrates from the passed loader whenever it changes —
 * the arcade hooks key the loader on the viewer's identity scope, so a
 * login/logout swaps in (and resets to) that identity's log (rAF-deferred, repo
 * lint rule: no synchronous setState in effects) — and advances via
 * {@link LocalBest.recordLocalScore} as runs finish, so the stats band updates
 * without re-reading storage. Tracked for signed-in viewers too (harmless — the
 * arcade hooks only READ it when the viewer is signed out).
 */
export interface LocalBest {
  localBest: number;
  /** Fold a finished run's score into the local best (monotonic max). */
  recordLocalScore: (score: number) => void;
}

export function useLocalBest(loadLog: () => number[]): LocalBest {
  const [localBest, setLocalBest] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      // Full reset (seed 0, not the previous max) — a scope switch must not
      // carry the old identity's best over.
      setLocalBest(loadLog().reduce((m, s) => Math.max(m, s), 0))
    );
    return () => cancelAnimationFrame(raf);
  }, [loadLog]);

  const recordLocalScore = useCallback((score: number) => {
    setLocalBest((b) => (score > b ? score : b));
  }, []);

  return { localBest, recordLocalScore };
}
