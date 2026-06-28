import { type ReactNode } from "react";

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

// Segment into graphemes so ZWJ sequences / variation selectors stay intact; falls back to plain text without Intl.Segmenter.
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
