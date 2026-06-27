import { ConsoleTitleBar } from "@/shared/ui/overlays/console";

/**
 * Title bar atop the header menu — faux terminal window chrome: two
 * close/minimise marks + a filename → `◼ ◻ menu.sh`. The burger is the RIGHT
 * cap of this row (rendered once by `Header` as a top-right overlay); we reserve
 * its 36px footprint here (`burgerSlot`) so the title never slides under it. The
 * row is pulled up+right by the panel's 2px border (`-mt-0.5 -mr-0.5`) so its
 * box coincides with the burger's `size-9` box — one clean 36px row.
 */
export function PromptHeader({ burgerSlot }: { burgerSlot: number }) {
  return (
    <ConsoleTitleBar
      title="menu.sh"
      className="-mt-0.5 -mr-0.5 min-h-9 pr-0"
      trailing={
        <span aria-hidden style={{ marginLeft: "auto", width: burgerSlot }} />
      }
    />
  );
}
