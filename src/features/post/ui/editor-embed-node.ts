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

// Round-trips losslessly: the node serializes to the bare URL the read view's
// `remarkMediaEmbeds` re-detects, so there's no bespoke directive to persist.
// SECURITY: only ever stores a VALIDATED descriptor + the original url; renders
// NO iframe, so nothing user-controlled reaches a player here.

interface EmbedAttrs {
  kind: MediaEmbed["kind"];
  spotifyType: string;
  id: string;
  // Re-emitted verbatim on serialize so the link round-trips.
  url: string;
}

// Styled by `.mono-embed-card` in crepe-overrides.scss.
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

// Atom leaf block node — round-trips to a bare-URL paragraph.
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
      // Pasted "Copy embed code" iframe: validate src through the whitelist and
      // store the canonical embed src; a non-whitelisted iframe returns false so
      // ProseMirror drops it (we never keep a raw iframe).
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
  // No parse runner — the $prose transform below upgrades the plain link node
  // after the doc is built; serialize just writes the bare URL back.
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
    // Re-validate so a hand-mangled attr can't slip a bad type past the whitelist.
    return parseEmbedUrl(attrs.url) ?? null;
  }
  return null;
}

const embedTransformKey = new PluginKey("MILKDOWN_MEDIA_EMBED_TRANSFORM");

// Replaces any sole-link paragraph with a `mediaEmbed` node after each doc
// change — also lights up already-loaded posts (links arrive as paragraphs).
const embedTransform = $prose((ctx) => {
  const mediaEmbedType = mediaEmbedSchema.type(ctx);

  return new Plugin({
    key: embedTransformKey,
    appendTransaction: (_transactions, _oldState, newState) => {
      const replacements: { from: number; to: number; node: ProseNode }[] = [];

      newState.doc.descendants((node, pos) => {
        if (node.type.name !== "paragraph") return;
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

// Milkdown stores links as a mark on a text node, not an inline node.
function soleLinkUrl(paragraph: ProseNode): string | null {
  const children: ProseNode[] = [];
  paragraph.forEach((child) => {
    if (child.isText && (child.text ?? "").trim() === "") return;
    children.push(child);
  });
  if (children.length !== 1) return null;

  const only = children[0];

  // Link as an inline node — rare in this schema, but handle it.
  if (only.type.name === "link") {
    const href = only.attrs?.href;
    return typeof href === "string" ? href : null;
  }

  if (only.isText) {
    const linkMark = only.marks.find((m) => m.type.name === "link");
    const href = linkMark?.attrs?.href;
    return typeof href === "string" ? href : null;
  }

  return null;
}

// `remarkDirective` is harmless here but kept for parity; Map-keyed use() dedups.
export const mediaEmbed = [
  remarkDirective,
  mediaEmbedSchema,
  embedTransform,
].flat();
