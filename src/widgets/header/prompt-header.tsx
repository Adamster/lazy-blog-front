import { ConsoleTitleBar } from "@/shared/ui/console";

/**
 * Title bar atop the header menu — the menu is a faux terminal window, so it
 * wears the same console chrome (two close/minimise marks + a filename) as the
 * error page's panel, plus a blinking cursor. (The signed-in `@handle` now lives
 * in the header bar itself, not here.)
 */
export function PromptHeader() {
  return (
    <ConsoleTitleBar
      title="menu.sh"
      trailing={
        <span
          aria-hidden
          className="ml-auto text-[var(--m-accent)]"
          style={{ animation: "lzblink 1.1s steps(1) infinite" }}
        >
          _
        </span>
      }
    />
  );
}
