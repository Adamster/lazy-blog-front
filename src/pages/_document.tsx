import { GoogleAnalytics } from "@/shared/lib/head/google-analytics";
import { MetaLinks } from "@/shared/lib/head/meta-links";
import { Analytics } from "@vercel/analytics/react";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
          strategy="afterInteractive"
        /> */}
        <GoogleAnalytics />
        <MetaLinks />
      </Head>

      <body>
        <Main />
        <NextScript />
        <Analytics />
      </body>
    </Html>
  );
}
