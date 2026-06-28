/**
 * Hand-rolled inline-markdown tokenizer for COMMENT bodies — a restricted subset,
 * NOT the PostBody pipeline. The composer no longer authors marks, but the read
 * view keeps tokenizing them so already-authored comments still render.
 *
 * SECURITY: renders ZERO raw HTML (no `dangerouslySetInnerHTML`) — literal
 * `<script>`/`<img>` shows as text. Image `src` is whitelist-gated to KLIPY/Tenor
 * https CDNs (`parseGifUrl`); link hrefs sanitized to http/https only (`safeHref`);
 * a rejected URL renders as its literal source text.
 */

import { type ReactNode } from "react";

import { safeHref } from "@/shared/lib/safe-url";

import { withBigEmoji } from "./comment-emoji";
import { parseGifUrl } from "./comment-gif";

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

// Order matters: code FIRST (backticks shield emphasis), image before link (both start `[`, image's `!` wins),
// links before emphasis (so `*` inside a URL isn't italic).
// Kept as a SOURCE string, not a shared RegExp: renderInline recurses into emphasis, and a shared global `/g`
// regex would share `lastIndex` across the nested call and deadlock on any multi-mark line like `**a** *b*`.
const TOKEN_SOURCE =
  // code | image ![alt](url) | link [label](url) | autolink | bold | italic(*) | italic(_) | strike
  "(`+)([^`]*?)\\1|!\\[([^\\]]*)\\]\\(([^()\\s]+)\\)|\\[([^\\]]+)\\]\\(([^()\\s]+)\\)|(https?:\\/\\/[^\\s<]+[^\\s<.,;:!?)\\]}'\"])|\\*\\*([^*]+?)\\*\\*|(?<![A-Za-z0-9])_([^_]+?)_(?![A-Za-z0-9])|(?<![*\\w])\\*(?!\\s)([^*]+?)\\*|~~([^~]+?)~~";

function renderInline(text: string): ReactNode {
  // Fresh per call → independent `lastIndex`, safe under recursion.
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
      // Plain <img> not next/image: these hosts aren't in next.config remotePatterns (owner can't edit Vercel config).
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

export function renderCommentMarkdown(text: string): ReactNode {
  return renderInline(text);
}
