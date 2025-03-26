import Head from "next/head";

export interface MetaProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | string;
  url?: string;
  card?: string;
}

export const GenerateMeta = ({
  title = "",
  description = "The fine art of not being lazy… most of the time",
  image = "https://notlazy.org/images/preview.jpg",
  type = "website",
  url = "https://notlazy.org",
  card = "summary_large_image",
}: MetaProps) => {
  const fullTitle = title ? `${title} | !Lazy Blog` : "!Lazy Blog";
  const fullUrl = url ? `https://notlazy.org${url}` : "https://notlazy.org";

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta key="description" name="description" content={description} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta key="og:title" property="og:title" content={fullTitle} />
      <meta
        key="og:description"
        property="og:description"
        content={description}
      />
      <meta key="og:image" property="og:image" content={image} />
      <meta key="og:type" property="og:type" content={type} />
      <meta key="og:url" property="og:url" content={fullUrl} />

      {/* Twitter */}
      <meta key="twitter:title" name="twitter:title" content={fullTitle} />
      <meta
        key="twitter:description"
        name="twitter:description"
        content={description}
      />
      <meta key="twitter:image" name="twitter:image" content={image} />
      <meta name="twitter:card" content={card} />

      <link rel="canonical" href={fullUrl} />
    </Head>
  );
};
