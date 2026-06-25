import {
  parseEmbedUrl,
  splitIframeBlob,
  type MediaEmbed,
} from "@/shared/lib/media-embed";

/**
 * remark transform — detect a paragraph whose SOLE content is a YouTube / Spotify
 * URL (a bare autolinked URL, or a link whose visible text equals its href) and
 * rewrite it to a custom `media-embed` hast node, routed to `<MediaEmbed>` by
 * `post-body.tsx`. This makes EXISTING posts (which contain plain links) render
 * as players with zero markdown migration.
 *
 * SECURITY: the only data forwarded onto the node is the kind/type/id that
 * `parseEmbedUrl` extracted and VALIDATED (strict regex + host whitelist). The
 * raw URL never reaches the iframe — `<MediaEmbed>` rebuilds the canonical `src`
 * from the validated id. A URL that doesn't parse is left as the original link.
 *
 * Mirrors the existing directive bridges in `post-body.tsx`: scoped, whitelisted,
 * sets `hName` + plain-string `hProperties`. Runs BEFORE the literalize pass so it
 * sees the autolinked `link` nodes remark-gfm produced.
 */

interface MdNode {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

/** Build the leaf `media-embed` mdast node from a VALIDATED descriptor, carrying
 *  only the kind/type/id as plain string props (never a raw URL). Shared by the
 *  bare-link path and the raw-`<iframe>` path so both emit the identical node. */
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

/** A paragraph qualifies if, ignoring whitespace-only text, its only child is a
 *  link (`[text](url)` or an autolinked bare URL) to an embeddable resource. */
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

        // Replace the paragraph with a leaf `media-embed` node carrying the
        // validated descriptor as plain string props (never the raw URL).
        return embedNode(embed);
      });
    };
    walk(tree);
  };
}

/**
 * remark transform — turn raw `<iframe>` EMBED HTML into `media-embed` nodes.
 *
 * Real posts contain pasted "Copy embed code" markup — block-level mdast `html`
 * nodes like `<iframe src="https://open.spotify.com/embed/track/…" … />`, often
 * several collapsed into one `html` blob. The read view renders NO raw HTML, so
 * these would literalise to `<iframe …>` source text. Here we split each block
 * `html` node on its iframe tags (`splitIframeBlob`) and, for every iframe whose
 * `src` clears the host + type + id whitelist, emit a `media-embed` node — the
 * SAME node the bare-link path produces, so the renderer is unchanged.
 *
 * SCOPE: only BLOCK-level `html` nodes (a child of root or another block, NOT a
 * `paragraph`) are split — a `media-embed` is block-level and can't nest in a
 * `<p>`, and the real bug is always blank-line-separated iframe blocks. An inline
 * `html` iframe inside a prose paragraph is left untouched (it stays inert text,
 * exactly as today). Non-whitelisted / unparseable iframes stay as inert text too
 * (never rendered as live HTML — same no-raw-HTML security model as before).
 */
export function remarkIframeEmbeds() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (!node.children) return;
      // Only split html nodes that are BLOCK-level (the parent isn't a
      // paragraph) — embeds can't legally nest inside a <p>.
      const blockLevel = node.type !== "paragraph";

      node.children = node.children.flatMap((child): MdNode[] => {
        if (!blockLevel || child.type !== "html" || !child.value) {
          walk(child);
          return [child];
        }
        const parts = splitIframeBlob(child.value);
        // No embeddable iframe → leave the html node exactly as-is.
        if (parts.length === 1 && parts[0].kind === "text") return [child];

        return parts.map((part) =>
          part.kind === "embed"
            ? embedNode(part.embed)
            : // Leftover text/markup between iframes — keep as an inert html node
              // so the read view escapes it (never renders it as live HTML).
              { type: "html", value: part.value }
        );
      });
    };
    walk(tree);
  };
}
