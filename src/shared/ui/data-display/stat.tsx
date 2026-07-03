import type { ComponentType, ReactNode, SVGProps } from "react";
import { Label } from "../forms/label";
import { Spinner } from "../feedback/loading";

// ONE sign rule for every read-only stat value: positive = accent,
// negative = error, zero = muted. Interactive vote counters are the documented
// exception — their color encodes the viewer's vote state, not the sign.
export const signColor = (v: number) =>
  v > 0 ? "var(--m-accent)" : v < 0 ? "var(--m-error)" : "var(--m-muted)";

interface StatProps {
  /** Without the `// ` prefix — rendered by Label. */
  label: string;
  /** Preformatted display string (each surface keeps its own formatter). */
  value: string;
  /** The raw number behind `value` — drives the sign color. */
  signOf: number;
  sub?: ReactNode;
  subIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Extra node anchored to the value box (e.g. arcade "+N" score pops). */
  valueExtra?: ReactNode;
  /** Server-backed value still loading — spinner instead of a misleading 0. */
  loading?: boolean;
}

/** The canonical stat block: muted data label → 46px sign-colored value →
 *  optional 11px muted2 sub-row. Profile stats and the arcade band render
 *  through this — don't hand-roll the anatomy. */
export function Stat({
  label,
  value,
  signOf,
  sub,
  subIcon: SubIcon,
  valueExtra,
  loading = false,
}: StatProps) {
  return (
    <div>
      <Label tone="muted">{label}</Label>
      {loading ? (
        <div className="mt-4 flex h-[46px] items-center">
          <Spinner className="text-[26px] text-[var(--m-accent)]" />
        </div>
      ) : (
        <div className="relative mt-4 inline-block">
          <div
            className="font-display text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums"
            style={{ color: signColor(signOf) }}
          >
            {value}
          </div>
          {valueExtra}
        </div>
      )}
      {sub ? (
        <div className="mt-2 flex items-center gap-2.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
          {SubIcon ? <SubIcon aria-hidden className="size-3.5" /> : null}
          {sub}
        </div>
      ) : null}
    </div>
  );
}
