/* eslint-disable @next/next/next-script-for-ga */
import { LayoutClient } from "@/app/layout-client";
import { Mulish } from "next/font/google";

const font = Mulish({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mulish",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-MJC16ETF2H"
        ></script>

        <script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-MJC16ETF2H');
          `}
        </script>

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="site.webmanifest"></link>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      <body className={font.className}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
