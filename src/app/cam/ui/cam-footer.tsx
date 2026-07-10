import { CamShell } from "./cam-chrome";

export function CamFooter() {
  return (
    <footer className="cam-strip-top relative bg-[var(--m-panel)] pt-14 pb-10">
      <CamShell>
        <div className="mx-auto flex w-full max-w-[900px] flex-wrap items-center justify-between gap-x-6 gap-y-4 text-[11px] leading-[1.2] font-medium tracking-[0.12em] text-[var(--m-muted)] uppercase">
          <span className="text-[var(--m-fg)]">© 2026 Lazy Cam</span>
          <a
            href="mailto:support@notlazy.org"
            className="mono-focus transition-colors hover:text-[var(--m-accent)]"
          >
            support@notlazy.org
          </a>
        </div>
      </CamShell>
    </footer>
  );
}
