export type SwipeDir = "up" | "down" | "left" | "right";

/** Minimum swipe travel (CSS px) before a touch counts as a swipe — under it
 *  the gesture reports as a TAP instead. (The 2048 threshold, now shared.) */
export const SWIPE_MIN_PX = 24;

/**
 * Touch-gesture wiring for a game canvas: touchstart→touchend delta resolves
 * to a 4-way swipe (dominant axis) or a tap. Returns the cleanup function —
 * use straight as an effect body return. Pair the element with the
 * `touch-none` class so the gesture never scrolls the page.
 */
export function attachSwipe(
  el: HTMLElement,
  handlers: { onSwipe: (dir: SwipeDir) => void; onTap?: () => void }
): () => void {
  let sx = 0;
  let sy = 0;
  let active = false;

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    sx = t.clientX;
    sy = t.clientY;
    active = true;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) {
      handlers.onTap?.();
      return;
    }
    handlers.onSwipe(
      Math.abs(dx) >= Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up"
    );
  };

  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchend", onTouchEnd);
  return () => {
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchend", onTouchEnd);
  };
}
