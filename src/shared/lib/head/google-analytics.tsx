import Script from "next/script";

export const GoogleAnalytics = () => (
  <>
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
  </>
);
