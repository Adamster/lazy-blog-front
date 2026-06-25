import { describe, expect, it } from "vitest";
import {
  parseEmbedUrl,
  embedSrc,
  spotifyHeight,
  splitIframeBlob,
} from "./media-embed";

describe("parseEmbedUrl — YouTube", () => {
  it("parses watch?v=", () => {
    expect(
      parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  it("parses youtu.be short links (with extra query params)", () => {
    expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=42")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  it("parses /shorts/ and /embed/ paths", () => {
    expect(parseEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(
      parseEmbedUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
    ).toEqual({ kind: "youtube", id: "dQw4w9WgXcQ" });
  });

  it("rejects a malformed video id (wrong length / bad chars)", () => {
    expect(parseEmbedUrl("https://youtu.be/short")).toBeNull();
    expect(
      parseEmbedUrl("https://www.youtube.com/watch?v=../../etc/passwd")
    ).toBeNull();
  });

  it("builds the privacy-friendly nocookie embed src", () => {
    const e = parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ")!;
    expect(embedSrc(e)).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });
});

describe("parseEmbedUrl — Spotify", () => {
  it("parses each whitelisted resource type", () => {
    const id = "4cOdK2wGLETKBW3PvgPWqT";
    for (const type of [
      "track",
      "album",
      "playlist",
      "episode",
      "show",
    ] as const) {
      expect(parseEmbedUrl(`https://open.spotify.com/${type}/${id}`)).toEqual({
        kind: "spotify",
        type,
        id,
      });
    }
  });

  it("strips a locale prefix and an /embed/ prefix", () => {
    const id = "4cOdK2wGLETKBW3PvgPWqT";
    expect(
      parseEmbedUrl(`https://open.spotify.com/intl-de/track/${id}`)
    ).toEqual({ kind: "spotify", type: "track", id });
    expect(parseEmbedUrl(`https://open.spotify.com/embed/track/${id}`)).toEqual(
      {
        kind: "spotify",
        type: "track",
        id,
      }
    );
  });

  it("rejects a non-whitelisted type and a malformed id", () => {
    const id = "4cOdK2wGLETKBW3PvgPWqT";
    expect(parseEmbedUrl(`https://open.spotify.com/user/${id}`)).toBeNull();
    expect(parseEmbedUrl("https://open.spotify.com/track/bad")).toBeNull();
  });

  it("uses the compact player height for track/episode, taller otherwise", () => {
    expect(spotifyHeight("track")).toBe(152);
    expect(spotifyHeight("episode")).toBe(152);
    expect(spotifyHeight("album")).toBe(352);
    expect(spotifyHeight("playlist")).toBe(352);
  });

  it("builds the /embed/ src from the validated type + id", () => {
    const e = parseEmbedUrl(
      "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
    )!;
    expect(embedSrc(e)).toBe(
      "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT"
    );
  });
});

describe("parseEmbedUrl — iframe embed-url forms", () => {
  it("parses the youtube /embed/ src form", () => {
    expect(parseEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  it("parses the spotify /embed/ src form with utm query", () => {
    expect(
      parseEmbedUrl(
        "https://open.spotify.com/embed/track/6obTxej2mmfp6HqZvTWZGF?utm_source=generator"
      )
    ).toEqual({ kind: "spotify", type: "track", id: "6obTxej2mmfp6HqZvTWZGF" });
  });
});

describe("splitIframeBlob — raw <iframe> embed HTML", () => {
  const SPOTIFY =
    '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/6obTxej2mmfp6HqZvTWZGF?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write" loading="lazy" />';

  it("extracts a single Spotify iframe (double quotes, extra attrs, self-closing)", () => {
    expect(splitIframeBlob(SPOTIFY)).toEqual([
      {
        kind: "embed",
        embed: { kind: "spotify", type: "track", id: "6obTxej2mmfp6HqZvTWZGF" },
      },
    ]);
  });

  it("handles several iframes in one blob (each becomes its own embed)", () => {
    const blob = `${SPOTIFY} <iframe src='https://www.youtube.com/embed/dQw4w9WgXcQ'></iframe>`;
    const parts = splitIframeBlob(blob);
    const embeds = parts.filter((p) => p.kind === "embed");
    expect(embeds).toEqual([
      {
        kind: "embed",
        embed: { kind: "spotify", type: "track", id: "6obTxej2mmfp6HqZvTWZGF" },
      },
      { kind: "embed", embed: { kind: "youtube", id: "dQw4w9WgXcQ" } },
    ]);
  });

  it("reads a single-quoted src and a non-self-closing tag", () => {
    expect(
      splitIframeBlob(
        "<iframe src='https://www.youtube.com/embed/dQw4w9WgXcQ'></iframe>"
      )
    ).toEqual([
      { kind: "embed", embed: { kind: "youtube", id: "dQw4w9WgXcQ" } },
    ]);
  });

  it("leaves a non-whitelisted iframe as inert text (never an embed)", () => {
    const blob = '<iframe src="https://evil.com/embed/track/aaa"></iframe>';
    expect(splitIframeBlob(blob)).toEqual([{ kind: "text", value: blob }]);
  });

  it("returns the original blob as one text part when there is no iframe", () => {
    expect(splitIframeBlob("<div>hello</div>")).toEqual([
      { kind: "text", value: "<div>hello</div>" },
    ]);
  });
});

describe("parseEmbedUrl — rejection", () => {
  it("rejects non-whitelisted hosts and non-http(s) protocols", () => {
    expect(parseEmbedUrl("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(
      parseEmbedUrl("javascript:alert(1)//youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBeNull();
    expect(parseEmbedUrl("not a url")).toBeNull();
    expect(parseEmbedUrl("")).toBeNull();
  });
});
