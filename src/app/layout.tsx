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
            __html: `(function(){try{var e=document.documentElement;var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}e.setAttribute('data-theme',t);e.classList.toggle('dark',t==='dark');e.classList.toggle('crt',localStorage.getItem('crt')==='on');}catch(e){}})();`,
          }}
        />

        <GoogleAnalytics />
        <MetaLinks />
        <Analytics />
      </head>

      <body className={`${font.variable} ${display.variable} ${mono.variable}`}>
        <AppProviders>
          {/* This `<main>` clears the fixed header bar for EVERY route
              (`pt-[var(--m-header-h)]`); pages add no own page-top padding.
              Intentionally full-width: every page owns its own horizontal
              constraint (the `mono-scope` breakout pages re-constrain to
              `max-w-[1240px]` / `780` / `864`; `ErrorMessage`/`Loading`/the auth
              `Modal` portal self-cap). */}
          <main className="pt-[var(--m-header-h)]">{children}</main>
        </AppProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
