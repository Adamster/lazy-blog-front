"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fire ONCE when the element first scrolls into view (IntersectionObserver).
 * Single source for the scroll-triggered effects (`:type` decode-on-scroll, the
 * scanline sweep, terminal transcript reveal). Returns a ref to attach + a
 * boolean that flips `true` on first intersection and never resets.
 *
 * SSR / no-IO fallback: when `IntersectionObserver` is unavailable (older
 * engines, tests) the element is treated as already in view, so the static
 * end-state still shows. The observer self-disconnects after the first hit.
 */
export function useInViewOnce<T extends Element = HTMLElement>(
  rootMargin = "0px 0px -10% 0px"
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO (older engines / tests): reveal on the next frame so the static
      // end-state still shows, without a synchronous in-effect setState.
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
