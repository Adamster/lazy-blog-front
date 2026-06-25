import { $command, $markSchema } from "@milkdown/kit/utils";
import { toggleMark } from "@milkdown/kit/prose/commands";
import { remarkDirective } from "./editor-small-mark";

/**
 * Custom inline brand "effect" marks — `glitch` and `matrix` — modelled 1:1 on
 * the `small` mark (see `editor-small-mark.ts`, the reference pattern). Each is
 * an inline mark that wraps the selection and round-trips through markdown as a
 * remark **text directive** (`:glitch[…]` / `:matrix[…]`), the same safe,
 * markdown-native carrier `small` uses (the read view renders no raw HTML — no
 * `rehype-raw` — so directives, not HTML, are how custom inline marks persist).
 *
 * Round-trip (identical shape for both, per directive name):
 *   editor mark  --toMarkdown-->  textDirective{name}  --stringify-->  `:name[x]`
 *   `:name[x]`   --parse-->       textDirective{name}  --parseMarkdown-->  mark
 *
 * SINGLE remark-directive registration (the key risk): `remark-directive` is
 * registered exactly ONCE — by `smallMark`'s exported `remarkDirective`
 * ($remark). We deliberately REUSE that same instance here rather than create a
 * second `$remark("remarkDirective", …)`. `$remark` blindly *appends* its plugin
 * to `remarkPluginsCtx` (no dedup), so two registrations would add
 * `remark-directive` twice. But `editor.use()` stores plugins in a Map keyed by
 * the plugin reference, so listing the SAME `remarkDirective` instance in both
 * `smallMark` and `effectMarks` dedups to one entry → the directive plugin loads
 * exactly once. (Verified in node_modules: @milkdown/utils `$remark`,
 * @milkdown/core `Editor.use`/`#usrPluginStore`.)
 *
 * Editor DOM: the JS-driven read-view effects (glitch jitter / matrix scramble)
 * are read-view only. In the editor BOTH marks render as static, STILL-EDITABLE
 * spans in their NORMAL text colour, framed with a dotted box + a fast hover hint
 * (shared `.mono-fx-mark`, styled in crepe-overrides.scss) — no colour tint and
 * no shake, either of which could be mistaken for real styling. The author sees
 * the text carries an effect; the full animation appears only in the published
 * read view (`<PostBody>` → GlitchText / MatrixText).
 */

/** The inline `glitch` mark → `textDirective{name:"glitch"}`. Editor DOM is a
 *  flat framed hint span (normal colour, dotted box + hover hint); the shake is
 *  read-view only. `.mono-glitch` is kept for paste round-trip (parseDOM);
 *  `.mono-fx-mark` carries the framed-hint styling. */
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

/** The inline `matrix` mark → `textDirective{name:"matrix"}`. Editor DOM is a
 *  flat framed hint span (normal colour, dotted box + hover hint); the scramble-decode
 *  is read-view only. `.mono-matrix` is kept for paste round-trip (parseDOM);
 *  `.mono-fx-mark` carries the framed-hint styling. */
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

/**
 * Inline mark factory — the redact / spoiler / type / kbd / scan marks are all
 * identical in shape to glitch/matrix (an inclusive inline mark round-tripping as
 * a `textDirective` of the same name, framed in the editor by `.mono-fx-mark`);
 * only the directive name and the hover hint differ. Hoisted so the five marks
 * don't copy-paste the same 25-line schema each.
 */
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

/** The five new inline effect marks (read-view animated; editor = framed hint). */
export const redactSchema = makeEffectMark(
  "redact",
  "Redact — a censor bar in the published post"
);
export const spoilerSchema = makeEffectMark(
  "spoiler",
  "Spoiler — blurred until clicked in the published post"
);
export const typeSchema = makeEffectMark(
  "type",
  "Type — decodes on scroll in the published post"
);
export const kbdSchema = makeEffectMark(
  "kbd",
  "Keycap — renders as a key in the published post"
);
export const scanSchema = makeEffectMark(
  "scan",
  "Scan — highlighted with a sweep in the published post"
);
// Batch 2 attribute-free inline marks (same wrap shape — no extra UI to author).
// The attribute-carrying marks (`:cite`/`:ref`/`:stat`/`:link`) are deferred:
// they need a note/href/number input surface, so for now they round-trip only as
// hand-written directives (fully rendered in the read view).
export const strikeSchema = makeEffectMark(
  "strike",
  "Strike — a self-redacting edit in the published post"
);
export const waveSchema = makeEffectMark(
  "wave",
  "Wave — a caret sweep highlight in the published post"
);

/** Toggle the `glitch` mark on the current selection (toolbar Effects ▾). */
export const toggleGlitchCommand = $command(
  "ToggleGlitch",
  (ctx) => () => toggleMark(glitchSchema.type(ctx))
);

/** Toggle the `matrix` mark on the current selection (toolbar Effects ▾). */
export const toggleMatrixCommand = $command(
  "ToggleMatrix",
  (ctx) => () => toggleMark(matrixSchema.type(ctx))
);

export const toggleRedactCommand = $command(
  "ToggleRedact",
  (ctx) => () => toggleMark(redactSchema.type(ctx))
);
export const toggleSpoilerCommand = $command(
  "ToggleSpoiler",
  (ctx) => () => toggleMark(spoilerSchema.type(ctx))
);
export const toggleTypeCommand = $command(
  "ToggleType",
  (ctx) => () => toggleMark(typeSchema.type(ctx))
);
export const toggleKbdCommand = $command(
  "ToggleKbd",
  (ctx) => () => toggleMark(kbdSchema.type(ctx))
);
export const toggleScanCommand = $command(
  "ToggleScan",
  (ctx) => () => toggleMark(scanSchema.type(ctx))
);
export const toggleStrikeFxCommand = $command(
  "ToggleStrikeFx",
  (ctx) => () => toggleMark(strikeSchema.type(ctx))
);
export const toggleWaveCommand = $command(
  "ToggleWave",
  (ctx) => () => toggleMark(waveSchema.type(ctx))
);

/**
 * Everything needed to enable the effect marks. Includes the SHARED
 * `remarkDirective` (same instance as `smallMark`'s) — Map-keyed `use()` dedups
 * it, so the directive plugin still loads exactly once even with both bundles.
 */
export const effectMarks = [
  remarkDirective,
  glitchSchema,
  toggleGlitchCommand,
  matrixSchema,
  toggleMatrixCommand,
  redactSchema,
  toggleRedactCommand,
  spoilerSchema,
  toggleSpoilerCommand,
  typeSchema,
  toggleTypeCommand,
  kbdSchema,
  toggleKbdCommand,
  scanSchema,
  toggleScanCommand,
  strikeSchema,
  toggleStrikeFxCommand,
  waveSchema,
  toggleWaveCommand,
].flat();
