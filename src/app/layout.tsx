import { Mulish } from "next/font/google";

import "../assets/styles/global.scss";
import { GoogleAnalytics } from "@/shared/lib/head/google-analytics";
import { MetaLinks } from "@/shared/lib/head/meta-links";
import { AppProviders } from "@/shared/providers/app-providers";
import { Header } from "@/widgets/header";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

const font = Mulish({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />

        <GoogleAnalytics />
        <MetaLinks />
        <Analytics />
      </head>

      <body className={`${font.variable}`}>
        <AppProviders>
          <Header />
          <main className="max-w-4xl mx-auto">{children}</main>
        </AppProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
