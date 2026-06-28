import {
  embedSrc,
  embedLabel,
  spotifyHeight,
  type MediaEmbed as MediaEmbedDescriptor,
} from "@/shared/lib/media-embed";

// The iframe `src` is rebuilt from a VALIDATED id/type by `embedSrc` — never a raw user URL.
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
