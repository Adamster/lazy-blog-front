// Shared chrome for the /cam pages: content shell, section band.
// (The CamGlyph brand mark lives in shared/ui — the header lockup uses it too.)

import type { ReactNode } from "react";

// The single alignment column every /cam section shares (container 1240 +
// page gutter).
export function CamShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-10 ${className}`}>
      {children}
    </div>
  );
}

// Full-bleed --m-card band with the content shell inside.
export function CamBand({
  children,
  className = "",
  pad = "py-10",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** Vertical padding class — py-10 default, py-20 for the airy landing bands. */
  pad?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`bg-[var(--m-card)] ${pad} ${className}`} {...rest}>
      <CamShell>{children}</CamShell>
    </section>
  );
}
