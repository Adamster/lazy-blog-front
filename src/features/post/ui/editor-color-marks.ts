import { $command, $markSchema } from "@milkdown/kit/utils";
import { toggleMark } from "@milkdown/kit/prose/commands";
import type { Command } from "@milkdown/kit/prose/state";
import { remarkDirective } from "./editor-small-mark";

// Inline colour marks round-trip as attribute-free text directives because the
// read view renders no raw HTML — directives, not HTML, are how marks persist.
// Three fixed-name marks (not one `:color{name=…}` attribute mark) keep each
// colour a whitelisted, closed directive — the attribute round-trip is fragile
// and a wider injection surface.

function colorMarkSchema(name: "primary" | "muted" | "error") {
  return $markSchema(name, () => ({
    inclusive: true,
    // Self-excluding group ⇒ the three colours are mutually exclusive.
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

export const primarySchema = colorMarkSchema("primary");
export const mutedSchema = colorMarkSchema("muted");
export const errorSchema = colorMarkSchema("error");

export const setPrimaryCommand = $command(
  "SetColorPrimary",
  (ctx) => () => toggleMark(primarySchema.type(ctx))
);

export const setMutedCommand = $command(
  "SetColorMuted",
  (ctx) => () => toggleMark(mutedSchema.type(ctx))
);

export const setErrorCommand = $command(
  "SetColorError",
  (ctx) => () => toggleMark(errorSchema.type(ctx))
);

// Lifts all three colour marks across the range (not `toggleMark`, which only
// flips one type and would no-op when the active colour differs).
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
        // Collapsed selection: drop stored marks so the next typed text is uncoloured.
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

// Shares `smallMark`'s `remarkDirective` instance; Map-keyed use() dedups it.
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
