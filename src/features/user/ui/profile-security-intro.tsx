import { LockClosedIcon } from "@heroicons/react/24/outline";

// Duplicated in profile-avatar-zone; hoist to a shared const if it sticks.
const FILM_BG =
  "repeating-linear-gradient(135deg,var(--m-panel) 0 1px,transparent 1px 10px)";

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
