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
 * are read-view only. In the editor the marks render as static, styled,
 * STILL-EDITABLE spans (`.mono-glitch` wrapper for glitch so the author sees the
 * brand treatment; a plain styled span for matrix). The full animated effect
 * appears in the published read view (`<PostBody>` → GlitchText / MatrixText).
 */

/** The inline `glitch` mark → `textDirective{name:"glitch"}`. Editor DOM uses
 *  the `.mono-glitch` wrapper structure so the author sees the brand treatment;
 *  text stays editable (the animation is read-view only). */
export const glitchSchema = $markSchema("glitch", () => ({
  inclusive: true,
  parseDOM: [{ tag: "span.mono-glitch" }],
  // Editable .mono-glitch wrapper; the read view renders the full animated
  // GlitchText. We keep the inner editable text in `.mono-glitch-main` (hole 0)
  // and omit the ghost layers (decorative) so editing stays simple.
  toDOM: () => [
    "span",
    { class: "mono-glitch" },
    ["span", { class: "mono-glitch-main" }, 0],
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
 *  static styled span (the scramble-decode is read-view only); text editable. */
export const matrixSchema = $markSchema("matrix", () => ({
  inclusive: true,
  parseDOM: [{ tag: "span.mono-matrix" }],
  toDOM: () => ["span", { class: "mono-matrix" }, 0],
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
].flat();
