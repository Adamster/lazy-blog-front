import { parseEmbedUrl } from "@/shared/lib/media-embed";

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
        } satisfies MdNode;
      });
    };
    walk(tree);
  };
}
