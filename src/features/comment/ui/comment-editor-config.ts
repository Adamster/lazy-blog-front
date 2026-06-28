// Deliberately minimal Milkdown set for the COMMENT composer — hand-composed from a curated schema list
// (NOT the full Crepe class) so the authoring surface can ONLY produce what the inline-only read view renders.
// Closed node set is TEXT + PICTURES only (doc/paragraph/text + inline GIF/sticker image); formatting marks
// (bold/italic/strike), headings, lists, blockquote, code, tables, slash menu, etc. are intentionally absent.

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

export { insertImageCommand };

// The preset's hardbreak / soft-break plugins are deliberately OMITTED: they declare inter-plugin context
// deps that only resolve inside the FULL commonmark preset, so hand-picking them throws "Context not found"
// (caught by the round-trip test). remarkMarker is the one safe standalone transform with no such cross-dep.
export const commentMarks = [
  remarkMarker,

  // *Attr plugins are required alongside each schema — its toDOM reads its attr ctx.
  docSchema,
  paragraphAttr,
  paragraphSchema,
  textSchema,

  imageAttr,
  imageSchema,
  insertImageInputRule,
  insertImageCommand,

  bigEmoji,
].flat();
