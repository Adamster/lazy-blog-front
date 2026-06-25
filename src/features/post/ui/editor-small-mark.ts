import {
  $command,
  $inputRule,
  $markSchema,
  $remark,
} from "@milkdown/kit/utils";
import { toggleMark } from "@milkdown/kit/prose/commands";
import { markRule } from "@milkdown/kit/prose";
import directive from "remark-directive";

/**
 * Custom inline "small" mark — the FIRST custom mark in the editor and the
 * reference pattern for future brand inline components (glitch / matrix).
 *
 * Storage is a remark **text directive** (`:small[…]`), NOT raw HTML: the read
 * view deliberately renders no raw HTML (`<PostBody>` has no `rehype-raw`), so
 * the directive is the safe, markdown-native carrier. The same `:small[…]`
 * round-trips here (editor) and in `post-body.tsx` (read view → `<small>`).
 *
 * Round-trip:
 *   editor mark  --toMarkdown-->  textDirective{name:"small"}  --stringify-->  `:small[x]`
 *   `:small[x]`  --parse-->       textDirective{name:"small"}  --parseMarkdown-->  editor mark
 *
 * Built on the commonmark `emphasis` mark as the template (same inline
 * open/next/close parser shape, same `toggleMark` command).
 */

/** Registers `remark-directive` into Milkdown's remark pipeline so the
 *  parser/serializer understand `:small[…]` (and directive syntax generally). */
export const remarkDirective = $remark("remarkDirective", () => directive);

/** The inline `small` mark. Renders as a `<small>` element in the editor DOM
 *  (so the editor preview matches the read view), maps to a `textDirective`
 *  named `small` in markdown. */
export const smallSchema = $markSchema("small", () => ({
  // Inclusive so typing at the mark's edge keeps extending it (matches em/strong).
  inclusive: true,
  parseDOM: [{ tag: "small" }],
  toDOM: () => ["small", 0],
  parseMarkdown: {
    match: (node) => node.type === "textDirective" && node.name === "small",
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === "small",
    runner: (state, mark) => {
      // Emits `{ type: "textDirective", name: "small", children: [...] }`,
      // which remark-directive stringifies as `:small[…]`.
      state.withMark(mark, "textDirective", undefined, { name: "small" });
    },
  },
}));

/** Toggle the `small` mark on the current selection (dispatched by the toolbar
 *  SM button via the existing `runCommand` → `callCommand` path). */
export const toggleSmallCommand = $command(
  "ToggleSmall",
  (ctx) => () => toggleMark(smallSchema.type(ctx))
);

/** Optional input rule: typing `:small[text]` inline auto-applies the mark. */
export const smallInputRule = $inputRule((ctx) =>
  markRule(/:small\[([^\]]+)\]$/, smallSchema.type(ctx))
);

/** Everything needed to enable the `small` mark, in dependency order
 *  (remark plugin first so the schema's directive mapping resolves). */
export const smallMark = [
  remarkDirective,
  smallSchema,
  toggleSmallCommand,
  smallInputRule,
].flat();
