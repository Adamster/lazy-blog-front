import { Label } from "@/shared/ui";

/**
 * The touch/small-screen stand-in for a game (owner call: mobile play is
 * retired — too clumsy to be worth faking). Rendered in the board's grid slot
 * on every game page; the `touch-game-notice` utility hides it exactly where
 * the game itself shows (≥800px + fine pointer), so the two are complements.
 * The high-score rail stays visible either way.
 */
export function BoardUnsupported() {
  return (
    <div className="touch-game-notice">
      <Label>DESKTOP ONLY</Label>
      <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        This game isn&apos;t supported on touch or small screens — it wants a
        keyboard and some elbow room. The high scores still work down here.
      </p>
    </div>
  );
}
