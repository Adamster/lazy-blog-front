import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MdNode = { type: string; value?: string; children?: MdNode[] };

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
const components: Components = {
  a: ({ href, children, ...props }) => {
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
};

interface PostBodyProps {
  /** Raw markdown source. */
  markdown: string;
}

export function PostBody({ markdown }: PostBodyProps) {
  return (
    <div className="mono-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDropEmptyLines]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
