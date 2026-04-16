type Embed = { src: string; aspectRatio: string; height?: number };

export function toEmbedUrl(href: string): Embed | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id =
      url.searchParams.get("v") ??
      (url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : null);
    if (id) return { src: `https://www.youtube.com/embed/${id}`, aspectRatio: "16 / 9" };
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (id) return { src: `https://www.youtube.com/embed/${id}`, aspectRatio: "16 / 9" };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (/^\d+$/.test(id))
      return { src: `https://player.vimeo.com/video/${id}`, aspectRatio: "16 / 9" };
  }

  if (host === "open.spotify.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const supportedTypes = ["track", "playlist", "album", "episode", "show", "artist"];
    const typeIdx = parts[0] === "embed" ? 1 : 0;
    if (parts.length > typeIdx + 1 && supportedTypes.includes(parts[typeIdx])) {
      const type = parts[typeIdx];
      const id = parts[typeIdx + 1];
      return {
        src: `https://open.spotify.com/embed/${type}/${id}`,
        aspectRatio: "auto",
        height: type === "track" || type === "episode" ? 152 : 352,
      };
    }
  }

  return null;
}

const EMBED_MARK = "data-embed-applied";

export function applyEmbeds(root: HTMLElement): number {
  let replaced = 0;
  const anchors = root.querySelectorAll<HTMLAnchorElement>("a[href]");

  anchors.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    const embed = toEmbedUrl(href);
    if (!embed) return;

    // Find the block-level paragraph ancestor
    let block: HTMLElement | null = a.parentElement;
    while (block && !/^(P|DIV)$/.test(block.tagName)) {
      block = block.parentElement;
    }
    if (!block || block === root) return;
    if (block.hasAttribute(EMBED_MARK)) return;

    const trimmedText = block.textContent?.trim() ?? "";
    const linkText = a.textContent?.trim() ?? "";
    if (trimmedText !== linkText) return;

    const iframe = document.createElement("iframe");
    iframe.src = embed.src;
    iframe.loading = "lazy";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    iframe.setAttribute("allowfullscreen", "true");
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.borderRadius = "12px";
    iframe.style.display = "block";
    if (embed.height) {
      iframe.style.height = `${embed.height}px`;
    } else {
      iframe.style.aspectRatio = embed.aspectRatio;
      iframe.style.height = "auto";
    }

    const wrapper = document.createElement("div");
    wrapper.setAttribute(EMBED_MARK, "true");
    wrapper.style.margin = "1em 0";
    wrapper.appendChild(iframe);

    block.replaceWith(wrapper);
    replaced += 1;
  });

  return replaced;
}

export function observeEmbeds(root: HTMLElement): () => void {
  applyEmbeds(root);

  const observer = new MutationObserver(() => {
    applyEmbeds(root);
  });
  observer.observe(root, { childList: true, subtree: true });

  return () => observer.disconnect();
}
