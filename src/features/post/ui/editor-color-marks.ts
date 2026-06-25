import { $command, $markSchema } from "@milkdown/kit/utils";
import { toggleMark } from "@milkdown/kit/prose/commands";
import type { Command } from "@milkdown/kit/prose/state";
import { remarkDirective } from "./editor-small-mark";

/**
 * Custom inline brand "text colour" marks — `primary`, `muted`, `error` —
 * modelled 1:1 on the effect marks (see `editor-effect-marks.ts`). Each is an
 * inline mark that wraps the selection and round-trips through markdown as a
 * remark **text directive** (`:primary[…]` / `:muted[…]` / `:error[…]`), the
 * same safe, markdown-native carrier `small`/`glitch`/`matrix` use (the read
 * view renders no raw HTML — no `rehype-raw` — so directives, not HTML, are how
 * custom inline marks persist).
 *
 * WHY THREE MARKS, NOT ONE ATTRIBUTE MARK: a single `color` mark carrying the
 * chosen colour as a directive *attribute* (`:color[…]{name=primary}`) would
 * push a serialized value through remark-directive's attribute syntax — a
 * fragile round-trip and a wider surface for injection. Three fixed-name marks
 * keep each colour a closed, attribute-free directive (exactly like the effect
 * marks), so the read view only ever sees a whitelisted directive NAME.
 *
 * MUTUAL EXCLUSION: all three share the `group: "color"` AND set
 * `excludes: "color"`, so each colour mark excludes the whole group. ProseMirror
 * drops the others automatically when one is applied — `primary` then `muted`
 * leaves only `muted` (verified: prosemirror-model MarkSpec.excludes is a
 * space-separated list of group names a mark removes when added; `addToSet`
 * strips excluded marks).
 *
 * SINGLE remark-directive registration: like the effect marks, this bundle
 * REUSES `smallMark`'s exported `remarkDirective` instance rather than adding a
 * second `$remark` — `editor.use()` is Map-keyed by plugin reference, so the
 * directive plugin still loads exactly once across all three bundles.
 *
 * Editor DOM: each renders a `<span class="mono-color-…">` so the author sees
 * the tint while editing (rules in `crepe-overrides.scss`). The read view maps
 * the same directive names to whitelisted classes (`post-body.tsx` + prose.css).
 */

/** Build a colour mark schema for one directive name → `.mono-color-<name>`. */
function colorMarkSchema(name: "primary" | "muted" | "error") {
  return $markSchema(name, () => ({
    inclusive: true,
    // Shared group + self-excluding group ⇒ the three colours are mutually
    // exclusive (applying one removes any other).
    group: "color",
    excludes: "color",
    parseDOM: [{ tag: `span.mono-color-${name}` }],
    toDOM: () => ["span", { class: `mono-color-${name}` }, 0] as const,
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

/** Inline `primary` colour mark → `textDirective{name:"primary"}` (--m-accent). */
export const primarySchema = colorMarkSchema("primary");
/** Inline `muted` colour mark → `textDirective{name:"muted"}` (--m-muted). */
export const mutedSchema = colorMarkSchema("muted");
/** Inline `error` colour mark → `textDirective{name:"error"}` (--m-error). */
export const errorSchema = colorMarkSchema("error");

/** Set the `primary` colour on the selection (excludes auto-clear the others). */
export const setPrimaryCommand = $command(
  "SetColorPrimary",
  (ctx) => () => toggleMark(primarySchema.type(ctx))
);

/** Set the `muted` colour on the selection (excludes auto-clear the others). */
export const setMutedCommand = $command(
  "SetColorMuted",
  (ctx) => () => toggleMark(mutedSchema.type(ctx))
);

/** Set the `error` colour on the selection (excludes auto-clear the others). */
export const setErrorCommand = $command(
  "SetColorError",
  (ctx) => () => toggleMark(errorSchema.type(ctx))
);

/**
 * Remove ALL three colour marks from the selection — the "Default" choice (back
 * to `--m-fg`, i.e. no colour mark). Unlike `toggleMark` (which only flips one
 * type and would no-op when the active colour differs from the one passed), this
 * lifts every colour mark across the range regardless of which is active, so one
 * action always returns to the default colour.
 *
 * For a collapsed selection there's no range to strip, so we also clear any
 * stored marks (the "about to type" set) for all three types, so typing forward
 * from inside a coloured run starts uncoloured.
 */
export const clearColorCommand = $command(
  "ClearColor",
  (ctx) => (): Command => {
    const types = [
      primarySchema.type(ctx),
      mutedSchema.type(ctx),
      errorSchema.type(ctx),
    ];
    return (state, dispatch) => {
      const { from, to, empty } = state.selection;
      if (empty) {
        // Nothing selected — just drop the stored (pending) colour marks so the
        // next typed text is uncoloured. No range edit to perform.
        if (dispatch) {
          let tr = state.tr;
          for (const type of types) tr = tr.removeStoredMark(type);
          dispatch(tr);
        }
        return true;
      }
      if (dispatch) {
        let tr = state.tr;
        for (const type of types) tr = tr.removeMark(from, to, type);
        dispatch(tr.scrollIntoView());
      }
      return true;
    };
  }
);

/**
 * Everything needed to enable the colour marks. Includes the SHARED
 * `remarkDirective` (same instance as `smallMark`'s) — Map-keyed `use()` dedups
 * it, so the directive plugin still loads exactly once even with all bundles.
 */
export const colorMarks = [
  remarkDirective,
  primarySchema,
  setPrimaryCommand,
  mutedSchema,
  setMutedCommand,
  errorSchema,
  setErrorCommand,
  clearColorCommand,
].flat();
