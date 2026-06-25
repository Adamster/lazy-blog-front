import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { GlitchText } from "./glitch-text";
import { MatrixText } from "./matrix-text";
import { RevealMark } from "./reveal-mark";
import { Kbd } from "./kbd";
import { ScanText } from "./scan-text";
import { AsciiDivider, PullQuote, Callout } from "./prose-blocks";
import { Transcript, type TranscriptLine } from "./transcript";
import { CiteTooltip } from "./cite-tooltip";
import { MarginRef } from "./margin-ref";
import { CountUp } from "./count-up";
import { WaveHighlight } from "./wave-highlight";
import { ScanLink } from "./scan-link";
import { DiffBlock } from "./diff-block";
import { PollBlock, type PollRow } from "./poll-block";
import { AnsiBlock } from "./ansi-block";
import { FoldBlock } from "./fold-block";
import { CompareSlider } from "./compare-slider";
import { MediaEmbed } from "./media-embed";
import { remarkMediaEmbeds, remarkIframeEmbeds } from "./remark-media-embeds";
import type { SpotifyType } from "@/shared/lib/media-embed";

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  name?: string;
  attributes?: Record<string, string | null | undefined>;
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

/**
 * Milkdown's "preserve empty line" plugin serialises blank lines as literal
 * `<br />` HTML (e.g. the trailing empty paragraph Crepe auto-adds after a
 * divider). We don't render raw HTML (no `rehype-raw`), so those would show as
 * the text "<br />". Drop those exact `<br>` nodes (and any paragraph they leave
 * empty) so only Crepe's real line breaks remain — every other HTML node is
 * left untouched (still not rendered), so the security posture is unchanged.
 */
function remarkDropEmptyLines() {
  const isBr = (n: MdNode) =>
    n.type === "html" && /^<br\s*\/?>$/i.test((n.value ?? "").trim());
  const isEmptyParagraph = (n: MdNode) =>
    n.type === "paragraph" && (n.children?.length ?? 0) === 0;

  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (!node.children) return;
      node.children.forEach(walk);
      node.children = node.children.filter(
        (c) => !isBr(c) && !isEmptyParagraph(c)
      );
    };
    walk(tree);
  };
}

/**
 * Bridge our custom `:small[…]` text directive to a `<small>` element. The
 * editor stores the "small" inline mark as a remark `textDirective` named
 * `small` (see `editor-small-mark.ts`); here we set its hast name so
 * react-markdown renders `<small>` (styled 12px by `.mono-prose small`).
 *
 * Scoped to the ONE directive name we own — any UNKNOWN directive is left as a
 * bare `textDirective` mdast node with no `hName`, so react-markdown renders
 * nothing for it (it executes nothing): the directive syntax stays inert/safe.
 */
function remarkSmallDirective() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (node.type === "textDirective" && node.name === "small") {
        node.data = { ...node.data, hName: "small" };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Bridge our custom `:glitch[…]` / `:matrix[…]` text directives to custom hast
 * tags (`glitch` / `matrix`) so react-markdown routes them to the `GlitchText` /
 * `MatrixText` components below (via the `components` map). Same pattern and same
 * safety stance as `remarkSmallDirective`: scoped to the exact directive names
 * we own — any UNKNOWN directive keeps no `hName` and renders nothing (inert).
 */
const INLINE_EFFECT_TAGS = new Set([
  "glitch",
  "matrix",
  "redact",
  "spoiler",
  "type",
  "kbd",
  "scan",
  // Batch 2 inline marks.
  "cite",
  "ref",
  "stat",
  "strike",
  "wave",
  "link",
]);

function remarkEffectDirectives() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (
        node.type === "textDirective" &&
        node.name &&
        INLINE_EFFECT_TAGS.has(node.name)
      ) {
        // Forward directive ATTRIBUTES as plain string props (e.g. `:cite[x]{note}`
        // note text, `:link[x]{href}`). Same safety stance as the block bridge:
        // attributes are passed as strings, never as colours/styles.
        node.data = {
          ...node.data,
          hName: node.name,
          hProperties: { ...node.attributes },
        };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Bridge our BLOCK effect directives — the leaf `::divider` and the container
 * `:::quote` / `:::callout` / `:::terminal` — to custom hast tags routed to the
 * block primitives below. Same safety stance as the inline bridge: scoped to the
 * exact names we own (any other leaf/container directive keeps no `hName` and is
 * literalised by `remarkLiteralizeUnknownDirectives`). Directive ATTRIBUTES (the
 * `{variant}` / `{type}` / `{cite}` braces remark-directive parses into
 * `attributes`) are forwarded as plain string props — never as colours/styles.
 */
const LEAF_BLOCK_TAGS = new Set(["divider", "ansi"]);
const CONTAINER_BLOCK_TAGS = new Set([
  "quote",
  "callout",
  "terminal",
  // Batch 2 line-based blocks — collapsed to a `\n`-joined `lines` string below.
  "diff",
  "poll",
  "fold",
  "compare",
]);

/** Flatten a directive node's text content to one trimmed line per child block
 *  (paragraph) — used to turn a `:::terminal` body into transcript rows. */
function blockTextLines(node: MdNode): string[] {
  const text = (n: MdNode): string =>
    n.value ?? (n.children ?? []).map(text).join("");
  return (node.children ?? [])
    .map((child) => text(child).trim())
    .filter((line) => line.length > 0);
}

function remarkBlockDirectives() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (
        node.type === "leafDirective" &&
        node.name &&
        LEAF_BLOCK_TAGS.has(node.name)
      ) {
        node.data = {
          ...node.data,
          hName: node.name,
          hProperties: { ...node.attributes },
        };
      } else if (
        node.type === "containerDirective" &&
        node.name &&
        CONTAINER_BLOCK_TAGS.has(node.name)
      ) {
        // `:::terminal` / `:::diff` / `:::poll` / `:::fold` / `:::compare` are
        // line-based: collapse each child block to a single line of text here (at
        // mdast level, where paragraph boundaries still exist) and pass them as a
        // `\n`-joined `lines` string — the rendered React children would otherwise
        // lose the line breaks. `:::quote` / `:::callout` keep their rendered
        // children (real prose).
        const LINE_BASED = new Set([
          "terminal",
          "diff",
          "poll",
          "fold",
          "compare",
        ]);
        const extra = LINE_BASED.has(node.name)
          ? { lines: blockTextLines(node).join("\n") }
          : {};
        node.data = {
          ...node.data,
          hName: node.name,
          hProperties: { ...node.attributes, ...extra },
        };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Bridge our custom text-colour directives (`:primary[…]` / `:muted[…]` /
 * `:error[…]`) to a `<span>` carrying a FIXED, whitelisted class — the editor
 * stores each colour as its own inline mark/directive (see
 * `editor-color-marks.ts`).
 *
 * SECURITY: the colour is NEVER taken from a directive-supplied value. We map
 * the directive NAME (a member of this closed whitelist) to a hard-coded CSS
 * class (`mono-color-*`), and the actual colour lives in `prose.css` as a token.
 * Nothing user-controlled reaches an inline `style`, so arbitrary-colour
 * injection is impossible. Any other directive name keeps no `hName` and renders
 * nothing (inert), same stance as the small/effect bridges.
 */
const COLOR_DIRECTIVE_CLASS = {
  primary: "mono-color-primary",
  muted: "mono-color-muted",
  error: "mono-color-error",
} as const;

function remarkColorDirectives() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (node.type === "textDirective" && node.name) {
        const cls =
          COLOR_DIRECTIVE_CLASS[
            node.name as keyof typeof COLOR_DIRECTIVE_CLASS
          ];
        if (cls) {
          node.data = {
            ...node.data,
            hName: "span",
            hProperties: { ...node.data?.hProperties, className: cls },
          };
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Catch-all for directives we DON'T own. `remark-directive` parses any `:name`
 * in the markdown as a directive — including incidental colons in existing
 * content (e.g. a "1:30:00" timestamp parses `:00` as a directive). An unhandled
 * directive is rendered as a block `<div>` by mdast-util-to-hast, which inside a
 * paragraph is invalid HTML (`<div>` in `<p>`) and crashes hydration. So AFTER
 * the known-directive bridges (small/effect/colour) have set their `hName`,
 * convert every remaining (un-`hName`'d) directive back to its literal source
 * text — it then renders as plain inline text, harmlessly, with no content lost.
 */
function remarkLiteralizeUnknownDirectives() {
  const isDirective = (n: MdNode) =>
    n.type === "textDirective" ||
    n.type === "leafDirective" ||
    n.type === "containerDirective";
  const textOf = (n: MdNode): string =>
    (n.children ?? []).map((c) => c.value ?? textOf(c)).join("");
  const literal = (n: MdNode) => {
    const prefix =
      n.type === "containerDirective"
        ? ":::"
        : n.type === "leafDirective"
          ? "::"
          : ":";
    const label = n.children?.length ? `[${textOf(n)}]` : "";
    return `${prefix}${n.name ?? ""}${label}`;
  };

  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (!node.children) return;
      node.children = node.children.map((c) => {
        if (isDirective(c) && !c.data?.hName) {
          return { type: "text", value: literal(c) };
        }
        walk(c);
        return c;
      });
    };
    walk(tree);
  };
}

/**
 * Flatten a directive's rendered React children to a plain string — both effect
 * components take their text as a string prop (`GlitchText` needs `children:
 * string`, `MatrixText` needs `text: string`), but react-markdown hands us
 * React nodes. The directive content is plain inline text, so this recursion
 * over string/number/array/element-children resolves to the underlying text.
 */
function childrenToString(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string") return child;
      if (typeof child === "number") return String(child);
      if (
        child &&
        typeof child === "object" &&
        "props" in child &&
        child.props != null &&
        typeof child.props === "object" &&
        "children" in child.props
      ) {
        return childrenToString(
          (child.props as { children: ReactNode }).children
        );
      }
      return "";
    })
    .join("");
}

/**
 * Shared, server-compatible markdown renderer for the "Brutalist Mono" prose
 * sub-scale. Used by BOTH the server-rendered post read view AND the editor's
 * live preview, so the two are identical by construction.
 *
 * Security: raw HTML is intentionally NOT rendered (no `rehype-raw`). Content is
 * user-generated markdown; only markdown syntax is honoured. Images render as a
 * plain lazy <img> (arbitrary UGC URLs; we deliberately avoid next/image domain
 * whitelisting here). Styling lives in `src/assets/styles/prose.css`, scoped to
 * the `.mono-prose` wrapper.
 */

/**
 * Element → design mapping. The visual treatment is driven by the `.mono-prose`
 * stylesheet; here we only set element-level attributes that CSS can't (lazy
 * images, safe link rel, code language hook).
 */
const components = {
  a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt, ...props }: ComponentPropsWithoutRef<"img">) => (
    // Plain <img>, not next/image: prose images are arbitrary UGC URLs and we
    // deliberately avoid next/image domain whitelisting here. `alt` comes from
    // the markdown (`![alt](src)`), falling back to "" for decorative images.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ""} loading="lazy" {...props} />
  ),
  // Custom inline brand effects, routed here by `remarkEffectDirectives` (which
  // sets `hName: "glitch" | "matrix"`). Both pull their text out of `children`
  // (plain inline text) and hand it to the component as the string prop it
  // expects. `react-markdown`'s `Components` type only knows HTML tags, so the
  // custom keys are added via the cast below.
  glitch: ({ children }: { children?: ReactNode }) => (
    <GlitchText>{childrenToString(children)}</GlitchText>
  ),
  matrix: ({ children }: { children?: ReactNode }) => (
    <MatrixText text={childrenToString(children)} />
  ),
  redact: ({ children }: { children?: ReactNode }) => (
    <RevealMark variant="redact">{childrenToString(children)}</RevealMark>
  ),
  spoiler: ({ children }: { children?: ReactNode }) => (
    <RevealMark variant="blur">{childrenToString(children)}</RevealMark>
  ),
  // `:type[…]` — one MatrixText decode pass when scrolled into view, then rests
  // as plain text.
  type: ({ children }: { children?: ReactNode }) => (
    <MatrixText text={childrenToString(children)} trigger="scroll" />
  ),
  kbd: ({ children }: { children?: ReactNode }) => (
    <Kbd>{childrenToString(children)}</Kbd>
  ),
  scan: ({ children }: { children?: ReactNode }) => (
    <ScanText>{childrenToString(children)}</ScanText>
  ),
  // `:cite[term]{note}` — dotted term + decode tooltip. The note text comes from
  // the directive attribute (a plain string, never a style).
  cite: ({ children, note }: { children?: ReactNode; note?: string }) => (
    <CiteTooltip note={note ?? ""}>{childrenToString(children)}</CiteTooltip>
  ),
  // `:ref[n]` — superscript footnote tag (jump-links to `#note-n`).
  ref: ({ children }: { children?: ReactNode }) => (
    <MarginRef n={childrenToString(children)} />
  ),
  // `:stat[1240]` — counting readout (rolls up on scroll-in). Non-numeric content
  // falls back to 0.
  stat: ({ children }: { children?: ReactNode }) => {
    const n = parseInt(childrenToString(children).replace(/[^0-9-]/g, ""), 10);
    return <CountUp value={Number.isFinite(n) ? n : 0} />;
  },
  // `:strike[…]` — self-redacting edit (strike draws on scroll-in).
  strike: ({ children }: { children?: ReactNode }) => (
    <RevealMark variant="strike">{childrenToString(children)}</RevealMark>
  ),
  // `:wave[…]` — caret sweep highlight.
  wave: ({ children }: { children?: ReactNode }) => (
    <WaveHighlight>{childrenToString(children)}</WaveHighlight>
  ),
  // `:link[label]{href}` — scanline hover link. `href` is a plain string prop;
  // ScanLink applies the safe external-link rel.
  link: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <ScanLink href={href}>{childrenToString(children)}</ScanLink>
  ),
  // BLOCK directives. `::divider{variant}` → an ASCII section break; the
  // whitelisted variant comes from the directive attribute (never a style).
  divider: ({ variant }: { variant?: string }) => (
    <AsciiDivider
      variant={variant === "slash" || variant === "mark" ? variant : "dots"}
    />
  ),
  // `:::quote{cite}` → a terminal pull-quote (its content is the quote body).
  quote: ({ children, cite }: { children?: ReactNode; cite?: string }) => (
    <PullQuote cite={cite}>{children}</PullQuote>
  ),
  // `:::callout{type}` → a console callout (note | warn); content is prose.
  callout: ({ children, type }: { children?: ReactNode; type?: string }) => (
    <Callout type={type === "warn" ? "warn" : "note"}>{children}</Callout>
  ),
  // `:::terminal` → a read-only transcript. The `lines` prop (set by
  // `remarkBlockDirectives`) is the `\n`-joined body; a leading `$ ` marks a
  // prompt (accent), `! ` an error, otherwise output.
  terminal: ({ lines }: { lines?: string }) => {
    const rows: TranscriptLine[] = (lines ?? "")
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => {
        if (l.startsWith("$ ")) return { text: l, tone: "prompt" as const };
        if (l.startsWith("! "))
          return { text: l.slice(2), tone: "error" as const };
        return { text: l, tone: "output" as const };
      });
    return <Transcript lines={rows} />;
  },
  // `:::diff` → a redline/patch block. `lines` (set by `remarkBlockDirectives`)
  // is the `\n`-joined body; `+ ` / `- ` prefixes mark added/removed lines.
  diff: ({ lines }: { lines?: string }) => <DiffBlock body={lines ?? ""} />,
  // `:::poll` → an ASCII bar readout. Each body line is `Label | 62` (label, then
  // a `|`-separated numeric percentage). Lines without a number are skipped.
  poll: ({ lines }: { lines?: string }) => {
    const rows: PollRow[] = (lines ?? "")
      .split("\n")
      .map((l) => {
        const [label, raw] = l.split("|");
        const value = parseInt((raw ?? "").replace(/[^0-9]/g, ""), 10);
        return { label: (label ?? "").trim(), value };
      })
      .filter((r) => r.label.length > 0 && Number.isFinite(r.value));
    return <PollBlock rows={rows} />;
  },
  // `::ansi{tokens}` → a leaf colour-swatch block. The whitelisted token names
  // come from the directive attribute (AnsiBlock ignores any non-whitelisted
  // name — the colour is a fixed token, never user-supplied).
  ansi: ({ tokens }: { tokens?: string }) => <AnsiBlock tokens={tokens} />,
  // `:::fold{summary}` → a terminal spoiler. The body decodes once on first open;
  // `summary` is the closed-state label.
  fold: ({ lines, summary }: { lines?: string; summary?: string }) => (
    <FoldBlock summary={summary} decode={lines ?? ""} />
  ),
  // `:::compare{before,after}` → a before/after slider. Body is two lines: the
  // first is the BEFORE panel text, the second the AFTER; labels come from attrs.
  compare: ({
    lines,
    before,
    after,
  }: {
    lines?: string;
    before?: string;
    after?: string;
  }) => {
    const [b = "", a = ""] = (lines ?? "").split("\n");
    return (
      <CompareSlider
        before={b}
        after={a}
        beforeLabel={before}
        afterLabel={after}
      />
    );
  },
  // YouTube / Spotify embed — `remarkMediaEmbeds` rewrites a paragraph that is
  // ONLY a YT/Spotify link into this node, forwarding the VALIDATED kind/id/type
  // as plain string props (never the raw URL). Reconstruct the discriminated
  // descriptor here and hand it to `<MediaEmbed>`, which rebuilds the iframe src.
  "media-embed": (props: {
    kind?: string;
    videoId?: string;
    spotifyType?: string;
    spotifyId?: string;
  }) => {
    if (props.kind === "youtube" && props.videoId) {
      return <MediaEmbed embed={{ kind: "youtube", id: props.videoId }} />;
    }
    if (props.kind === "spotify" && props.spotifyType && props.spotifyId) {
      return (
        <MediaEmbed
          embed={{
            kind: "spotify",
            type: props.spotifyType as SpotifyType,
            id: props.spotifyId,
          }}
        />
      );
    }
    return null;
  },
} as Components;

interface PostBodyProps {
  /** Raw markdown source. */
  markdown: string;
}

export function PostBody({ markdown }: PostBodyProps) {
  return (
    <div className="mono-prose">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkDirective,
          remarkSmallDirective,
          remarkEffectDirectives,
          remarkBlockDirectives,
          remarkColorDirectives,
          // Turn a paragraph that is ONLY a YouTube/Spotify link into an embed
          // node (existing posts carry plain links — no migration needed).
          remarkMediaEmbeds,
          // Turn pasted raw `<iframe>` embed HTML (Spotify/YouTube "Copy embed
          // code") into the same embed node — lights up existing posts at render
          // time, no re-save (the read view literalises raw HTML otherwise).
          remarkIframeEmbeds,
          remarkLiteralizeUnknownDirectives,
          remarkDropEmptyLines,
        ]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
