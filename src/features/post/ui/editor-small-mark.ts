import {
  $command,
  $inputRule,
  $markSchema,
  $remark,
} from "@milkdown/kit/utils";
import { toggleMark } from "@milkdown/kit/prose/commands";
import { markRule } from "@milkdown/kit/prose";
import directive from "remark-directive";

// Reference pattern for the brand inline marks (glitch / matrix). Storage is a
// remark text directive, NOT raw HTML — the read view renders no raw HTML, so
// the directive is the safe, markdown-native carrier.

export const remarkDirective = $remark("remarkDirective", () => directive);

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
      state.withMark(mark, "textDirective", undefined, { name: "small" });
    },
  },
}));

export const toggleSmallCommand = $command(
  "ToggleSmall",
  (ctx) => () => toggleMark(smallSchema.type(ctx))
);

export const smallInputRule = $inputRule((ctx) =>
  markRule(/:small\[([^\]]+)\]$/, smallSchema.type(ctx))
);

// remark plugin first so the schema's directive mapping resolves.
export const smallMark = [
  remarkDirective,
  smallSchema,
  toggleSmallCommand,
  smallInputRule,
].flat();
