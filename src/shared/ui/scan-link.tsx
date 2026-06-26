import { safeHref } from "@/shared/lib/safe-url";

interface ScanLinkProps {
  /** Link label. */
  children: string;
  /** Destination. External (`https?://`) opens in a new safe tab. */
  href?: string;
  className?: string;
}

/**
 * Scanline hover link — rests muted, and on hover/focus colour-reveals
 * `muted → accent` while a 2px `--m-accent` underline sweeps in L→R (pure CSS,
 * `.mono-scanlink`). The documented link treatment (colour-reveal, never a
 * permanent underline) plus the brutalist sweep. Powers the `:link[…]{href}`
 * post directive. Static + server-safe; reduced motion swaps colour instantly and
 * shows the underline without the sweep.
 */
export function ScanLink({
  children,
  href = "#",
  className = "",
}: ScanLinkProps) {
  // Gate the user-authored directive href: only a real http/https URL is kept;
  // anything unsafe (`javascript:`, `data:`, malformed, …) falls back to "#" so
  // a `:link[x]{javascript:…}` can never render an executable link.
  const safe = safeHref(href) ?? "#";
  const external = /^https?:\/\//.test(safe);
  return (
    <a
      href={safe}
      className={`mono-scanlink ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="mono-scanlink-label">{children}</span>
    </a>
  );
}
