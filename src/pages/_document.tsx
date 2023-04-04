import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* SEO */}
      <title>Not Lazy Blog</title>
      <meta property="og:title" content="Not Lazy Blog" />
      <meta property="og:site_name" content="Not Lazy Blog" />

      {/* <meta
        property="og:image"
        content="http://euro-travel-example.com/thumbnail.jpg"
      /> */}
      {/* <meta
        property="og:url"
        content="http://euro-travel-example.com/index.htm"
      /> */}
      {/* <meta name="twitter:card" content="summary_large_image" /> */}

      <meta
        name="description"
        content="Вы искали лучший в мире Блог? Срочно прекратите поиски, он перед вами!"
      />
      <meta
        property="og:description"
        content="Вы искали лучший в мире Блог? Срочно прекратите поиски, он перед вами!"
      />

      {/* <meta name="twitter:image:alt" content="Alt text for image" /> */}

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
