"use client";

import { useEffect, useRef, useState } from "react";

// Fires once when the element first scrolls into view; flips `true` and never
// resets. No-IO fallback (older engines/tests): treat as already in view.
export function useInViewOnce<T extends Element = HTMLElement>(
  rootMargin = "0px 0px -10% 0px"
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // Reveal on the next frame to avoid a synchronous in-effect setState.
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
