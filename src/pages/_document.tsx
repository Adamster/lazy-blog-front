import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

const Document = () => {
  return (
    <Html>
      <Head />

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
};

export default Document;
