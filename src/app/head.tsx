import Script from "next/script";
import React from "react";

export default function RootHead() {
  return (
    <head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-MJC16ETF2H"
        strategy="afterInteractive"
        async
      />

      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', 'G-MJC16ETF2H');
        `}
      </Script>

      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/fav/apple-touch-icon.png"
      />

      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/fav/favicon-32x32.png"
      />

      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/fav/favicon-16x16.png"
      />

      <link rel="manifest" href="https://notlazy.org/site.webmanifest"></link>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
  );
}
