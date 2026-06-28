import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { GlitchText, MatrixText } from "@/shared/ui/effects";
import { RevealMark } from "./reveal-mark";
import { AsciiDivider } from "./prose-blocks";
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

// Milkdown serialises blank lines as literal `<br />`; we render no raw HTML, so
// these would show as the text "<br />" — drop the exact `<br>` nodes + empty paragraphs.
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

const INLINE_EFFECT_TAGS = new Set(["glitch", "matrix", "spoiler", "strike"]);

function remarkEffectDirectives() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (
        node.type === "textDirective" &&
        node.name &&
        INLINE_EFFECT_TAGS.has(node.name)
      ) {
        node.data = {
          ...node.data,
          hName: node.name,
        };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

// Directive ATTRIBUTES (`{variant}`/`{type}` braces) are forwarded as plain string props — never colours/styles.
const LEAF_BLOCK_TAGS = new Set(["divider"]);

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
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

// SECURITY: colour comes from the directive NAME mapped to a hard-coded class, never
// a directive-supplied value — nothing user-controlled reaches an inline `style`.
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

// remark-directive parses incidental colons (e.g. "1:30:00" → `:00`) as directives; an
// unhandled one renders as `<div>` inside `<p>` and crashes hydration. After the known
// bridges set `hName`, turn every remaining directive back into literal inert text.
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

// Flatten directive children to a plain string — the effect components take text as a
// string prop, but react-markdown hands us React nodes.
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

// Security: raw HTML is intentionally NOT rendered (no `rehype-raw`); only markdown
// syntax is honoured. Styling lives in `prose.css`, scoped to `.mono-prose`.
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
    // Plain <img>, not next/image: prose images are arbitrary UGC URLs (no domain whitelisting).
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ""} loading="lazy" {...props} />
  ),
  glitch: ({ children }: { children?: ReactNode }) => (
    <GlitchText>{childrenToString(children)}</GlitchText>
  ),
  matrix: ({ children }: { children?: ReactNode }) => (
    <MatrixText text={childrenToString(children)} />
  ),
  spoiler: ({ children }: { children?: ReactNode }) => (
    <RevealMark variant="blur">{childrenToString(children)}</RevealMark>
  ),
  strike: ({ children }: { children?: ReactNode }) => (
    <RevealMark variant="strike">{childrenToString(children)}</RevealMark>
  ),
  divider: ({ variant }: { variant?: string }) => (
    <AsciiDivider variant={variant === "slash" ? "slash" : "dots"} />
  ),
  // Forwards the VALIDATED kind/id/type as plain string props (never the raw URL); rebuild the descriptor for <MediaEmbed>.
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
          remarkMediaEmbeds,
          // Raw `<iframe>` embed HTML → embed node (the read view literalises raw HTML otherwise).
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
