interface Props {
  title: string;
  description: string;
  image?: string | null;
  url?: string;
}

export const generateMeta = ({ title, description, image, url }: Props) => {
  return {
    title: `${title} | !Lazy `,
    description: description,
    openGraph: {
      title: `${title} | !Lazy`,
      description: description,
      images: image
        ? [{ url: image }]
        : [{ url: "https://notlazy.org/preview.jpg" }],
      type: "article",
      url: `https://notlazy.org/${url ? url : undefined}`,
    },
    twitter: {
      title: `${title} | !Lazy`,
      description: description,
      images: image ? [image] : undefined,
      card: "summary_large_image",
    },
    robots: "index, follow",
  };
};
