import { type ReactNode } from "react";

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

/**
 * Render text with emoji enlarged (~1.5em). Native emoji otherwise inherit the
 * 14px body size and read tiny; we segment into graphemes (so ZWJ sequences /
 * variation selectors stay intact) and wrap emoji ones in a larger span,
 * leaving the surrounding text at body size. Falls back to plain text where
 * `Intl.Segmenter` is unavailable.
 */
export function withBigEmoji(text: string): ReactNode {
  if (!graphemeSegmenter) return text;
  const out: ReactNode[] = [];
  let buf = "";
  let key = 0;
  for (const { segment } of graphemeSegmenter.segment(text)) {
    if (EMOJI_RE.test(segment)) {
      if (buf) {
        out.push(buf);
        buf = "";
      }
      out.push(
        <span key={key++} className="align-[-0.1em] text-[1.5em] leading-none">
          {segment}
        </span>
      );
    } else {
      buf += segment;
    }
  }
  if (buf) out.push(buf);
  return out;
}
