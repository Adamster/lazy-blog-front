interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: string;
}

export const generateMeta = ({
  title,
  description = "The fine art of not being lazy… most of the time",
  image = "https://notlazy.org/images/preview.jpg",
  type,
}: Props) => {
  const title_mod = `${title} | !Lazy Blog`;
  return {
    title: title_mod,
    description: description,
    openGraph: {
      title: title_mod,
      description: description,
      images: [{ url: image }],
      type: type || "website",
    },
    twitter: {
      title: title_mod,
      description: description,
      images: [image],
      card: "summary_large_image",
    },
    robots: "index, follow",
  };
};
