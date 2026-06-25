/**
 * Minimal Milkdown plugin set for the COMMENT composer — a deliberately tiny
 * "Crepe on minimals". Where the post editor (`crepe.tsx`) instantiates the full
 * `Crepe` class (every feature bundled, then switched off), the comment editor
 * is hand-composed from a CURATED list of individual Milkdown schemas so the
 * authoring surface can ONLY produce the constructs the comment read view
 * (`renderCommentMarkdown`, inline-only) actually renders.
 *
 * NODES (the closed set — TEXT + PICTURES only):
 *   - doc / paragraph / text  → plain-text paragraphs
 *   - image                   → inline GIF / sticker (`![gif](url)`)
 *
 * The owner wants comments to be plain text + pictures (emoji + GIF + sticker
 * inline images) — NO formatting marks. So bold / italic / strikethrough are
 * intentionally ABSENT (no schema, no input rule, no keymap, no toggle command);
 * emoji are plain unicode text (enlarged display-only by the `bigEmoji`
 * decoration).
 *
 * STRIPPED vs the post Crepe (intentionally absent — the read view can't render
 * them, so they must not be authorable): headings, lists, blockquote, code /
 * code-block, tables, link-tooltip UI, the slash menu, block handles, the
 * floating selection toolbar, virtual cursor, the brand effect / colour / small
 * marks, the bold/italic/strike marks, and the YouTube/Spotify embed node.
 *
 * Each `$nodeSchema` here bundles its own parser + serializer runner, and the
 * image `*InputRule` gives the markdown-shortcut authoring affordance (paste
 * `![alt](url)` → inline image). The base parser/serializer + remark transform
 * pipeline is provided by `@milkdown/core` + the marker remark plugin included
 * below, so the doc round-trips to clean commonmark markdown.
 */

import {
  docSchema,
  paragraphAttr,
  paragraphSchema,
  textSchema,
  imageAttr,
  imageSchema,
  insertImageCommand,
  insertImageInputRule,
  remarkMarker,
} from "@milkdown/kit/preset/commonmark";
import { bigEmoji } from "./comment-editor-big-emoji";

/** The image insert command re-exported so the toolbar's GIF/sticker picker
 *  imports it from one place. */
export { insertImageCommand };

/**
 * The curated minimal plugin list — passed to `editor.use(commentMarks)`.
 * Flattened so the schemas, input rule and the marker remark transform register
 * in one `use()` call. Grouped remark → node → image.
 *
 * NOTE: the preset's hardbreak / soft-break plugins are deliberately OMITTED —
 * they declare inter-plugin context deps (`hardbreakFilterNodes`,
 * `inlineNodesCursorPlugin`) that only resolve inside the FULL commonmark
 * preset; hand-picking them throws "Context not found" (caught by the round-trip
 * test). Comments don't need soft line breaks — Enter starts a new paragraph,
 * which is the only break the read view renders anyway. `remarkMarker` is the
 * one safe standalone transform (it normalises the markdown markers on
 * serialize) and has no such cross-dep.
 */
export const commentMarks = [
  // Marker normalisation on serialize (no cross-plugin context dep).
  remarkMarker,

  // Nodes (+ their `*Attr` plugins — each schema's `toDOM` reads its attr ctx).
  docSchema,
  paragraphAttr,
  paragraphSchema,
  textSchema,

  // Inline image (GIF / sticker). The input rule lets `![alt](url)` paste round-trip;
  // fresh GIFs are inserted via `insertImageCommand` (whitelist-gated upstream)
  // — the command must be registered here too.
  imageAttr,
  imageSchema,
  insertImageInputRule,
  insertImageCommand,

  // Enlarge emoji in the editor to ~1.5em (matching the read view) — a
  // display-only inline decoration, doesn't touch the doc/markdown.
  bigEmoji,
].flat();
