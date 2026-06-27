import {
  embedSrc,
  embedLabel,
  spotifyHeight,
  type MediaEmbed as MediaEmbedDescriptor,
} from "@/shared/lib/media-embed";

/**
 * On-system media embed — renders a YouTube / Spotify iframe player inside the
 * brutalist frame (2px `--m-dim` border, square corners, full article measure).
 * The `src` is rebuilt from a VALIDATED id/type by `embedSrc` — never a raw user
 * URL (see `shared/lib/media-embed.ts` security model). Server-renderable (no
 * hooks); used by the read view via `remarkMediaEmbeds`.
 *
 * - YouTube keeps a responsive 16:9 box (`aspect-ratio`), `allowFullScreen`.
 * - Spotify uses its fixed player height per resource type (track/episode 152,
 *   album/playlist/show 352).
 */
export function MediaEmbed({ embed }: { embed: MediaEmbedDescriptor }) {
  const src = embedSrc(embed);
  const title = embedLabel(embed);

  if (embed.kind === "youtube") {
    return (
      <div className="mono-embed mono-embed--yt">
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="mono-embed mono-embed--spotify">
      <iframe
        src={src}
        title={title}
        height={spotifyHeight(embed.type)}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  );
}
