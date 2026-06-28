import { ConsoleTitleBar } from "@/shared/ui";

// Reserves the overlaid burger's 36px footprint so the title never slides under
// it; `-mt-0.5 -mr-0.5` pulls the row onto the burger's box for one clean row.
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
