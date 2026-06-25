import { LockClosedIcon } from "@heroicons/react/24/outline";

/** Diagonal film-hatch — `--m-panel` 1px lines on transparent, 135° (the same
 *  fill as the Step-1 cover dropzone, so the two settings surfaces read alike;
 *  darker than a solid `--m-panel` fill). If this sticks, hoist to a shared const. */
const FILM_BG =
  "repeating-linear-gradient(135deg,var(--m-panel) 0 1px,transparent 1px 10px)";

/**
 * Step-2 (Security) LEFT panel of the edit-profile card — the context-panel
 * counterpart to {@link ProfileAvatarZone}. Framed identically (closed 2px
 * `--m-dim` box, `md:h-full` stretch to match the form panel's height), filled
 * with the Step-1 film-hatch, content vertically centered: the `LockClosedIcon`
 * mark, the accent sign-out heads-up as the eyebrow (changing the password ends
 * the session), and one line of UI-body lead copy. It absorbs the 1240 frame's
 * extra width so the form inputs keep the comfortable right-panel measure.
 */
export function ProfileSecurityIntro() {
  return (
    <div
      className="flex flex-col justify-center gap-6 border-2 border-[var(--m-dim)] p-10 md:h-full"
      style={{ background: FILM_BG }}
    >
      <LockClosedIcon
        className="size-9 text-[var(--m-muted)]"
        aria-hidden="true"
      />

      <div>
        <p className="text-[11px] leading-[1.2] tracking-[0.12em] text-[var(--m-accent)] uppercase">
          {"// you will be signed out after changing your password"}
        </p>
        <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          Keep your password strong and unique. We never display it back to you.
        </p>
      </div>
    </div>
  );
}
