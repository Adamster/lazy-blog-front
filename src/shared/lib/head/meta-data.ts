interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  card?: string;
  url?: string;
}

export const generateMeta = ({
  title,
  description = "The fine art of not being lazy… most of the time",
  image = "https://notlazy.org/images/preview.jpg",
  type = "website",
  card = "summary_large_image",
  url,
}: Props) => {
  const fullTitle = title ? `${title} | !Lazy Blog` : "!Lazy Blog";
  const fullUrl = url ? `https://notlazy.org${url}` : "https://notlazy.org";

  return {
    title: fullTitle,
    description: description,
    openGraph: {
      title: fullTitle,
      description: description,
      images: [{ url: image }],
      type: type,
      url: fullUrl,
    },
    twitter: {
      title: fullTitle,
      description: description,
      images: [image],
      card: card,
    },
    robots: "index, follow",
  };
};
