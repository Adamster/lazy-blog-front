import { $nodeSchema, $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import type { Node as ProseNode } from "@milkdown/kit/prose/model";
import {
  parseEmbedUrl,
  embedLabel,
  embedSrc,
  type MediaEmbed,
} from "@/shared/lib/media-embed";
import { remarkDirective } from "./editor-small-mark";

/**
 * Editor-side YouTube / Spotify embed — the authoring counterpart to the read
 * view's `<MediaEmbed>` (`shared/ui`). The author SEES a compact, on-system
 * "▶ <kind> embed" placeholder CARD (not a live iframe) wherever a YT/Spotify
 * link sits in the doc, so what-you-see matches the published page without the
 * jank/weight of a live player in the editable surface.
 *
 * ROUND-TRIP (lossless, and it lights up EXISTING posts):
 *   markdown `https://youtu.be/<id>` (a bare link in a paragraph)
 *     --parse-->  paragraph > link          (commonmark/gfm)
 *     --append--> `mediaEmbed` node          (the $prose transform below)
 *     --serialize-> paragraph > text(url)    (node.toMarkdown emits the bare URL)
 *   The serialized markdown is the SAME plain link the read view's
 *   `remarkMediaEmbeds` re-detects — so there is no bespoke directive to persist
 *   and no data loss; toggling between editor and read view is a no-op.
 *
 * SECURITY: identical posture to the read view — the node only ever stores a
 * VALIDATED descriptor (kind/type/id from `parseEmbedUrl`'s strict regex + host
 * whitelist) plus the original `url` (kept solely to re-serialize the same link).
 * The editor renders NO iframe, so nothing user-controlled reaches a player here.
 */

interface EmbedAttrs {
  kind: MediaEmbed["kind"];
  /** Spotify resource type (empty for YouTube). */
  spotifyType: string;
  id: string;
  /** Original URL — re-emitted verbatim on serialize so the link round-trips. */
  url: string;
}

/** Build the placeholder card DOM (a 2px-framed mono row with a ▶ glyph + label).
 *  Styled by `.mono-embed-card` in crepe-overrides.scss. */
function cardDOM(embed: MediaEmbed, url: string) {
  return [
    "div",
    {
      class: "mono-embed-card",
      "data-embed-kind": embed.kind,
      contenteditable: "false",
      title: url,
    },
    ["span", { class: "mono-embed-card__glyph" }, "▶"],
    ["span", { class: "mono-embed-card__label" }, embedLabel(embed)],
    ["span", { class: "mono-embed-card__url" }, url],
  ] as const;
}

/** The `mediaEmbed` leaf block node. Atom (no editable content) + selectable so
 *  it behaves like the image node; round-trips to a bare-URL paragraph. */
export const mediaEmbedSchema = $nodeSchema("mediaEmbed", () => ({
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  isolating: true,
  attrs: {
    kind: { default: "youtube", validate: "string" },
    spotifyType: { default: "", validate: "string" },
    id: { default: "", validate: "string" },
    url: { default: "", validate: "string" },
  },
  parseDOM: [
    {
      tag: "div.mono-embed-card",
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        const url = dom.getAttribute("title") ?? "";
        const embed = parseEmbedUrl(url);
        if (!embed) return false;
        return embedToAttrs(embed, url);
      },
    },
    {
      // PASTE: an author pastes Spotify/YouTube "Copy embed code" — a raw
      // `<iframe src="…/embed/…">`. Validate the src through the SAME whitelist
      // (host + type + id) and store the canonical embed `src` as the node's url
      // so it serialises to a bare link the read view re-detects. A non-whitelisted
      // iframe returns false → ProseMirror drops it (we never keep a raw iframe).
      tag: "iframe[src]",
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        const embed = parseEmbedUrl(dom.getAttribute("src") ?? "");
        if (!embed) return false;
        return embedToAttrs(embed, embedSrc(embed));
      },
    },
  ],
  toDOM: (node) => {
    const attrs = node.attrs as EmbedAttrs;
    const embed = attrsToEmbed(attrs);
    if (!embed) return ["div", { class: "mono-embed-card" }, attrs.url];
    return cardDOM(embed, attrs.url);
  },
  // No markdown PARSE runner: existing posts carry the embed as a plain link, and
  // the $prose transform below upgrades that link node into this node after the
  // doc is built. SERIALIZE writes the bare URL back as a paragraph so the link
  // persists (and the read view re-detects it).
  parseMarkdown: {
    match: () => false,
    runner: () => {},
  },
  toMarkdown: {
    match: (node) => node.type.name === "mediaEmbed",
    runner: (state, node) => {
      const { url } = node.attrs as EmbedAttrs;
      state.openNode("paragraph");
      state.addNode("text", undefined, url);
      state.closeNode();
    },
  },
}));

function embedToAttrs(embed: MediaEmbed, url: string): EmbedAttrs {
  return {
    kind: embed.kind,
    spotifyType: embed.kind === "spotify" ? embed.type : "",
    id: embed.id,
    url,
  };
}

function attrsToEmbed(attrs: EmbedAttrs): MediaEmbed | null {
  if (attrs.kind === "youtube" && attrs.id) {
    return { kind: "youtube", id: attrs.id };
  }
  if (attrs.kind === "spotify" && attrs.id && attrs.spotifyType) {
    // Re-validate through the parser so a hand-mangled attr can't slip a bad
    // type past the whitelist.
    return parseEmbedUrl(attrs.url) ?? null;
  }
  return null;
}

const embedTransformKey = new PluginKey("MILKDOWN_MEDIA_EMBED_TRANSFORM");

/**
 * ProseMirror plugin — after every doc change, find any paragraph whose SOLE
 * content is a YouTube/Spotify link and replace it with a `mediaEmbed` node. This
 * is what makes pasting/typing a link become an embed live, AND what lights up
 * already-loaded posts (their links arrive as paragraphs on mount).
 */
const embedTransform = $prose((ctx) => {
  const mediaEmbedType = mediaEmbedSchema.type(ctx);

  return new Plugin({
    key: embedTransformKey,
    appendTransaction: (_transactions, _oldState, newState) => {
      const replacements: { from: number; to: number; node: ProseNode }[] = [];

      newState.doc.descendants((node, pos) => {
        if (node.type.name !== "paragraph") return;
        // The paragraph must be exactly one link node (a `[text](url)` or an
        // autolinked bare URL → a single text node carrying a `link` mark).
        const url = soleLinkUrl(node);
        if (!url) return false;
        const embed = parseEmbedUrl(url);
        if (!embed) return false;

        replacements.push({
          from: pos,
          to: pos + node.nodeSize,
          node: mediaEmbedType.create(embedToAttrs(embed, url)),
        });
        return false;
      });

      if (replacements.length === 0) return null;

      const tr = newState.tr;
      // Apply back-to-front so earlier positions stay valid.
      for (const r of replacements.reverse()) {
        tr.replaceWith(tr.mapping.map(r.from), tr.mapping.map(r.to), r.node);
      }
      return tr.docChanged ? tr : null;
    },
  });
});

/**
 * Extract the URL when a paragraph is ONLY a single link — either an inline
 * `link` node (`[text](url)`), or a single text node bearing a `link` mark
 * (commonmark stores links as a mark in Milkdown's schema; gfm autolinks too).
 * Returns `null` for anything else (mixed prose, multiple links, etc.).
 */
function soleLinkUrl(paragraph: ProseNode): string | null {
  // Ignore leading/trailing whitespace-only text nodes.
  const children: ProseNode[] = [];
  paragraph.forEach((child) => {
    if (child.isText && (child.text ?? "").trim() === "") return;
    children.push(child);
  });
  if (children.length !== 1) return null;

  const only = children[0];

  // commonmark `link` as an inline NODE (rare in this schema, but handle it).
  if (only.type.name === "link") {
    const href = only.attrs?.href;
    return typeof href === "string" ? href : null;
  }

  // commonmark `link` as a MARK on a text node (the common case).
  if (only.isText) {
    const linkMark = only.marks.find((m) => m.type.name === "link");
    const href = linkMark?.attrs?.href;
    return typeof href === "string" ? href : null;
  }

  return null;
}

/** Everything needed to enable the editor embed node, in dependency order
 *  (the shared `remark-directive` instance is harmless here but keeps parity with
 *  the other custom-node bundles; Map-keyed `use()` dedups it). */
export const mediaEmbed = [
  remarkDirective,
  mediaEmbedSchema,
  embedTransform,
].flat();
