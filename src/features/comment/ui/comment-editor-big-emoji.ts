import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";

/**
 * Enlarge emoji INSIDE the editor to match the read view (`withBigEmoji`, ~1.5em)
 * — native emoji otherwise inherit the 14px body size and read tiny. A ProseMirror
 * inline-decoration plugin: segment each text node into graphemes (so ZWJ
 * sequences / variation selectors stay ONE unit) and wrap the emoji ones in a
 * `.mono-big-emoji` span (sized in `comment-editor.scss`). Decorations are a pure
 * DISPLAY layer — they never touch the doc or the serialized markdown.
 */
const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

const bigEmojiKey = new PluginKey("comment-big-emoji");

export const bigEmoji = $prose(
  () =>
    new Plugin({
      key: bigEmojiKey,
      props: {
        decorations(state) {
          if (!graphemeSegmenter) return DecorationSet.empty;
          const decos: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (!node.isText || !node.text) return;
            let offset = 0;
            for (const { segment } of graphemeSegmenter.segment(node.text)) {
              if (EMOJI_RE.test(segment)) {
                decos.push(
                  Decoration.inline(
                    pos + offset,
                    pos + offset + segment.length,
                    { class: "mono-big-emoji" }
                  )
                );
              }
              offset += segment.length;
            }
          });
          return DecorationSet.create(state.doc, decos);
        },
      },
    })
);
