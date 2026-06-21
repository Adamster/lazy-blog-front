import { ConsoleTitleBar } from "@/shared/ui/console";

/**
 * Title bar atop the header menu — the menu is a faux terminal window, so it
 * wears the same console chrome (two close/minimise marks + a filename) as the
 * error page's panel. (The signed-in `@handle` now lives in the header bar
 * itself, not here.)
 */
export function PromptHeader() {
  return <ConsoleTitleBar title="menu.sh" />;
}
