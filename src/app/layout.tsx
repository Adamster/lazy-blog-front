import { Mulish, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "../assets/styles/tailwind.css";
import "../assets/styles/global.scss";

import { GoogleAnalytics } from "@/shared/lib/head/google-analytics";
import { MetaLinks } from "@/shared/lib/head/meta-links";
import { AppProviders } from "@/shared/providers/app-providers";
// import { Header } from "@/widgets/header"; // temporarily hidden during redesign
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const font = Mulish({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Space_Grotesk({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        /> */}

        <GoogleAnalytics />
        <MetaLinks />
        <Analytics />
      </head>

      <body className={`${font.variable} ${display.variable} ${mono.variable}`}>
        <AppProviders>
          {/* Header temporarily hidden during the redesign — restore when the
              header itself is reworked. */}
          {/* <Header /> */}
          <main className="mx-auto max-w-4xl">{children}</main>
        </AppProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
