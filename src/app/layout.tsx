/* eslint-disable @next/next/next-script-for-ga */
import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import { Layout } from "../components/layout/layout";

const font = Mulish({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mulish",
});

export const metadata: Metadata = {
  title: "!LAZY Blog | Лень под наблюдением",
  description: "Технологии, дизайн, код и лень — всё в одном месте",
  authors: [{ name: "!LAZY Blog", url: "https://notlazy.org" }],
  openGraph: {
    title: "!LAZY Blog | Лень под наблюдением",
    description: "Технологии, дизайн, код и лень — всё в одном месте.",
    url: "https://notlazy.org",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    title: "!LAZY Blog | Лень под наблюдением",
    description: "Технологии, дизайн, код и лень — всё в одном месте.",
  },
  robots: "index, follow",
};

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
      </head>

      <body className={font.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
