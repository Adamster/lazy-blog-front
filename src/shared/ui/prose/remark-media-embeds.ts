import {
  parseEmbedUrl,
  splitIframeBlob,
  type MediaEmbed,
} from "@/shared/lib/media-embed";

// SECURITY: only the validated kind/type/id (from `parseEmbedUrl`) is forwarded onto the
// node — the raw URL never reaches the iframe (`<MediaEmbed>` rebuilds the src). Must run
// BEFORE the literalize pass, so it sees the autolinked `link` nodes remark-gfm produced.

interface MdNode {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

// Carries only the validated kind/type/id as plain string props (never a raw URL).
function embedNode(embed: MediaEmbed): MdNode {
  return {
    type: "media-embed",
    children: [],
    data: {
      hName: "media-embed",
      hProperties:
        embed.kind === "youtube"
          ? { kind: "youtube", videoId: embed.id }
          : {
              kind: "spotify",
              spotifyType: embed.type,
              spotifyId: embed.id,
            },
    },
  };
}

function soleLink(paragraph: MdNode): MdNode | null {
  const meaningful = (paragraph.children ?? []).filter(
    (c) => !(c.type === "text" && (c.value ?? "").trim() === "")
  );
  if (meaningful.length !== 1) return null;
  const only = meaningful[0];
  return only.type === "link" && typeof only.url === "string" ? only : null;
}

export function remarkMediaEmbeds() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (!node.children) return;
      node.children.forEach(walk);
      node.children = node.children.map((child) => {
        if (child.type !== "paragraph") return child;
        const link = soleLink(child);
        if (!link?.url) return child;
        const embed = parseEmbedUrl(link.url);
        if (!embed) return child;

        return embedNode(embed);
      });
    };
    walk(tree);
  };
}

// Turn pasted raw `<iframe>` embed HTML into `media-embed` nodes (the read view renders no
// raw HTML, so these would otherwise literalise to source text). Only BLOCK-level `html`
// nodes are split — a `media-embed` can't nest in a `<p>`. Non-whitelisted / unparseable
// iframes stay as inert text (never live HTML — same no-raw-HTML security model).
export function remarkIframeEmbeds() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (!node.children) return;
      const blockLevel = node.type !== "paragraph";

      node.children = node.children.flatMap((child): MdNode[] => {
        if (!blockLevel || child.type !== "html" || !child.value) {
          walk(child);
          return [child];
        }
        const parts = splitIframeBlob(child.value);
        if (parts.length === 1 && parts[0].kind === "text") return [child];

        return parts.map((part) =>
          part.kind === "embed"
            ? embedNode(part.embed)
            : // Leftover markup between iframes — inert html node, escaped by the read view.
              { type: "html", value: part.value }
        );
      });
    };
    walk(tree);
  };
}
