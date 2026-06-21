import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { GlitchText } from "./glitch-text";
import { MatrixText } from "./matrix-text";

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  name?: string;
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
function remarkEffectDirectives() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (node.type === "textDirective") {
        if (node.name === "glitch")
          node.data = { ...node.data, hName: "glitch" };
        else if (node.name === "matrix")
          node.data = { ...node.data, hName: "matrix" };
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
          remarkColorDirectives,
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
