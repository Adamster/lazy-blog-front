import { $command, $markSchema } from "@milkdown/kit/utils";
import { toggleMark } from "@milkdown/kit/prose/commands";
import { remarkDirective } from "./editor-small-mark";

// Inline effect marks round-trip as text directives because the read view
// renders no raw HTML — directives, not HTML, are how marks persist.
// `remark-directive` MUST register exactly once: `$remark` blindly appends (no
// dedup), but `editor.use()` is Map-keyed by reference, so reusing smallMark's
// `remarkDirective` instance across bundles loads the directive plugin once.
// Editor DOM renders a flat framed hint (no tint, no shake — either could be
// mistaken for real styling); the animation runs only in the read view.

// `.mono-glitch` is kept for paste round-trip (parseDOM).
export const glitchSchema = $markSchema("glitch", () => ({
  inclusive: true,
  parseDOM: [{ tag: "span.mono-glitch" }],
  toDOM: () => [
    "span",
    {
      class: "mono-glitch mono-fx-mark",
      "data-fx-hint": "Glitch — animates in the published post",
    },
    0,
  ],
  parseMarkdown: {
    match: (node) => node.type === "textDirective" && node.name === "glitch",
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === "glitch",
    runner: (state, mark) => {
      state.withMark(mark, "textDirective", undefined, { name: "glitch" });
    },
  },
}));

// `.mono-matrix` is kept for paste round-trip (parseDOM).
export const matrixSchema = $markSchema("matrix", () => ({
  inclusive: true,
  parseDOM: [{ tag: "span.mono-matrix" }],
  toDOM: () => [
    "span",
    {
      class: "mono-matrix mono-fx-mark",
      "data-fx-hint": "Matrix — animates in the published post",
    },
    0,
  ],
  parseMarkdown: {
    match: (node) => node.type === "textDirective" && node.name === "matrix",
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === "matrix",
    runner: (state, mark) => {
      state.withMark(mark, "textDirective", undefined, { name: "matrix" });
    },
  },
}));

// Factory so spoiler/strike don't copy-paste the same 25-line schema.
function makeEffectMark(name: string, hint: string) {
  return $markSchema(name, () => ({
    inclusive: true,
    parseDOM: [{ tag: `span.mono-${name}` }],
    toDOM: () => [
      "span",
      { class: `mono-${name} mono-fx-mark`, "data-fx-hint": hint },
      0,
    ],
    parseMarkdown: {
      match: (node) => node.type === "textDirective" && node.name === name,
      runner: (state, node, markType) => {
        state.openMark(markType);
        state.next(node.children);
        state.closeMark(markType);
      },
    },
    toMarkdown: {
      match: (mark) => mark.type.name === name,
      runner: (state, mark) => {
        state.withMark(mark, "textDirective", undefined, { name });
      },
    },
  }));
}

// Attribute-carrying marks (`:link`) are deferred — they need an href input
// surface, so they round-trip only as hand-written directives for now.
export const spoilerSchema = makeEffectMark(
  "spoiler",
  "Spoiler — blurred until clicked in the published post"
);
export const strikeSchema = makeEffectMark(
  "strike",
  "Strike — a self-redacting edit in the published post"
);

export const toggleGlitchCommand = $command(
  "ToggleGlitch",
  (ctx) => () => toggleMark(glitchSchema.type(ctx))
);

export const toggleMatrixCommand = $command(
  "ToggleMatrix",
  (ctx) => () => toggleMark(matrixSchema.type(ctx))
);

export const toggleSpoilerCommand = $command(
  "ToggleSpoiler",
  (ctx) => () => toggleMark(spoilerSchema.type(ctx))
);
export const toggleStrikeFxCommand = $command(
  "ToggleStrikeFx",
  (ctx) => () => toggleMark(strikeSchema.type(ctx))
);

// Shares `smallMark`'s `remarkDirective` instance; Map-keyed use() dedups it.
export const effectMarks = [
  remarkDirective,
  glitchSchema,
  toggleGlitchCommand,
  matrixSchema,
  toggleMatrixCommand,
  spoilerSchema,
  toggleSpoilerCommand,
  strikeSchema,
  toggleStrikeFxCommand,
].flat();
