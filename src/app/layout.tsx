import { Mulish, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "../assets/styles/tailwind.css";
import "../assets/styles/global.scss";
import "../assets/styles/prose.css";

import { GoogleAnalytics } from "@/shared/lib/head/google-analytics";
import { MetaLinks } from "@/shared/lib/head/meta-links";
import { AppProviders } from "@/app/app-providers";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Resolve + apply the theme to <html> BEFORE first paint (no
            light→dark flash). Runs synchronously ahead of body render. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var e=document.documentElement;e.setAttribute('data-theme',t);e.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />

        <GoogleAnalytics />
        <MetaLinks />
        <Analytics />
      </head>

      <body className={`${font.variable} ${display.variable} ${mono.variable}`}>
        <AppProviders>
          <main className="mx-auto max-w-4xl">{children}</main>
        </AppProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
