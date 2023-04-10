import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en" data-color-mode="dark">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <body>
        <Main />
        <NextScript />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MJC16ETF2H"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || []; function gtag()
            {dataLayer.push(arguments)}
            gtag('js', new Date()); gtag('config', 'G-MJC16ETF2H');
          `}
        </Script>
      </body>
    </Html>
  );
}
