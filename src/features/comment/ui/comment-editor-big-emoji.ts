import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";

// Enlarge editor emoji to match the read view. Segment into graphemes so ZWJ sequences / variation
// selectors stay ONE unit. Decorations are display-only — never touch the doc or serialized markdown.
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
