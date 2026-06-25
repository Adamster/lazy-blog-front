/**
 * Minimal, safe inline-markdown renderer for COMMENT bodies.
 *
 * Comments render a TINY, restricted subset only — NOT the heavy PostBody
 * pipeline (no react-markdown, no remark/rehype, no directives, no blocks). This
 * is a hand-rolled inline tokenizer (one pass over the text, a small set of
 * inline rules) that emits React nodes directly. Zero new deps, zero added
 * bundle weight, and full control of the security posture.
 *
 * SUPPORTED (inline only):
 *   - **bold**            → <strong>  (LEGACY: the composer no longer authors
 *   - *italic* / _italic_ → <em>       marks — comments are now TEXT + PICTURES
 *   - `inline code`       → mono chip  only — but the read view keeps tokenizing
 *   - ~~strike~~          → line/muted these so already-authored comments still
 *                                       render correctly. Safe to keep: pure
 *                                       rendering, no raw HTML, no added deps.)
 *   - ![alt](url)         → INLINE GIF image — ONLY when `url` passes the
 *                           KLIPY/Tenor whitelist (`parseGifUrl`); otherwise the
 *                           literal `![..](..)` source text is shown.
 *   - [label](url)        → safe external link (http/https only)
 *   - bare http(s):// URL → autolinked
 *   - line / paragraph breaks (handled by the caller's `whitespace-pre-line`)
 *
 * SECURITY (same posture as PostBody): we render ZERO raw HTML — there is no
 * `dangerouslySetInnerHTML` anywhere; every node is a real React element with
 * text children, so any literal `<script>`/`<img>` in the body is shown as text.
 * Image `src` is whitelist-gated to KLIPY/Tenor https CDNs (`parseGifUrl`); a
 * non-whitelisted `![..](..)` is rendered as its literal source text (it never
 * reaches an `<img src>`). Link hrefs are sanitized to http/https ONLY
 * (javascript:/data:/mailto:/etc. rejected) and a rejected link renders as its
 * plain source text. Safe links get `target="_blank"` +
 * `rel="nofollow ugc noopener noreferrer"`.
 */

import { type ReactNode } from "react";

/** Reuse the project's emoji-enlarging pass on each plain-text leaf. */
import { withBigEmoji } from "./comment-emoji";
/** Whitelist gate — only KLIPY/Tenor https URLs become an `<img src>`. */
import { parseGifUrl } from "./comment-gif";

/** A safe http/https href, or `null` when the URL must fall back to plain text. */
function safeHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url.toString();
}

function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow ugc noopener noreferrer"
      className="break-words text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
    >
      {children}
    </a>
  );
}

/**
 * Inline rules, tried left-to-right at each position. Each rule's regex is
 * anchored implicitly via `lastIndex` (we scan char-by-char and test at the
 * current cursor), and `render` turns the match into a node. `code` is matched
 * FIRST so backticks shield their content from the emphasis rules; the IMAGE
 * rule precedes the link rule (both start with `[`, but the image's `!` prefix
 * is matched first); links before emphasis so `*` inside a URL isn't italic.
 *
 * Kept as a SOURCE string (not a shared `RegExp`): `renderInline` recurses into
 * emphasis content (bold/italic/strike), so a single global `/g` regex would
 * share `lastIndex` across the nested call and corrupt the outer scan (it
 * deadlocks on any multi-mark line like `**a** *b*`). Each call builds its OWN
 * regex instance below, so the stateful `lastIndex` is never shared.
 */
const TOKEN_SOURCE =
  // code | image ![alt](url) | link [label](url) | autolink | bold | italic(*) | italic(_) | strike
  "(`+)([^`]*?)\\1|!\\[([^\\]]*)\\]\\(([^()\\s]+)\\)|\\[([^\\]]+)\\]\\(([^()\\s]+)\\)|(https?:\\/\\/[^\\s<]+[^\\s<.,;:!?)\\]}'\"])|\\*\\*([^*]+?)\\*\\*|(?<![A-Za-z0-9])_([^_]+?)_(?![A-Za-z0-9])|(?<![*\\w])\\*(?!\\s)([^*]+?)\\*|~~([^~]+?)~~";

/** Render the inline-markdown subset of a single text run to React nodes. */
function renderInline(text: string): ReactNode {
  // Fresh per call → an independent `lastIndex`, safe under recursion.
  const tokenRe = new RegExp(TOKEN_SOURCE, "g");
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const pushText = (slice: string) => {
    if (slice) out.push(<span key={key++}>{withBigEmoji(slice)}</span>);
  };

  for (
    let match = tokenRe.exec(text);
    match !== null;
    match = tokenRe.exec(text)
  ) {
    pushText(text.slice(last, match.index));
    const [
      ,
      ,
      codeBody,
      imageAlt,
      imageUrl,
      linkLabel,
      linkUrl,
      autolink,
      bold,
      italicUnderscore,
      italicStar,
      strike,
    ] = match;

    if (codeBody !== undefined) {
      out.push(
        <code
          key={key++}
          className="bg-[var(--m-card)] px-1 py-0.5 font-mono text-[0.92em] text-[var(--m-fg)]"
        >
          {codeBody}
        </code>
      );
    } else if (imageUrl !== undefined) {
      // INLINE GIF — only a whitelisted KLIPY/Tenor https URL becomes an <img>;
      // anything else falls back to the literal `![alt](url)` source text (it
      // never reaches an `<img src>`). These hosts aren't in next.config
      // remotePatterns (owner can't edit Vercel config), so a plain <img> —
      // framed on-system, capped width, lazy.
      const safe = parseGifUrl(imageUrl);
      if (safe) {
        out.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key++}
            src={safe}
            alt={imageAlt?.trim() || "GIF"}
            loading="lazy"
            className="my-1 block max-w-[280px] border-2 border-[var(--m-dim)]"
          />
        );
      } else {
        pushText(match[0]);
      }
    } else if (linkLabel !== undefined && linkUrl !== undefined) {
      const href = safeHref(linkUrl);
      // A malformed / unsafe link falls back to the literal source text.
      if (href) {
        out.push(
          <Link key={key++} href={href}>
            {linkLabel}
          </Link>
        );
      } else {
        pushText(match[0]);
      }
    } else if (autolink !== undefined) {
      const href = safeHref(autolink);
      if (href) {
        out.push(
          <Link key={key++} href={href}>
            {autolink}
          </Link>
        );
      } else {
        pushText(match[0]);
      }
    } else if (bold !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold">
          {renderInline(bold)}
        </strong>
      );
    } else if (italicUnderscore !== undefined || italicStar !== undefined) {
      out.push(
        <em key={key++} className="italic">
          {renderInline((italicUnderscore ?? italicStar) as string)}
        </em>
      );
    } else if (strike !== undefined) {
      out.push(
        <span key={key++} className="text-[var(--m-muted)] line-through">
          {renderInline(strike)}
        </span>
      );
    }

    last = match.index + match[0].length;
  }
  pushText(text.slice(last));

  return out;
}

/** Render a comment's TEXT portion (GIF tail already split off) as nodes. */
export function renderCommentMarkdown(text: string): ReactNode {
  return renderInline(text);
}
