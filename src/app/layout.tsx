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
            light→dark / non-neo→neo flash). MUST be a RAW inline <script> in
            <head> so it runs SYNCHRONOUSLY during HTML parse — `next/script`
            `beforeInteractive` loads via Next's loader AFTER first paint, which
            reintroduces the flash. (Tradeoff: React 19 dev-only logs a
            "script tag in component" notice on client nav; harmless, prod-clean.)
            ONE source of truth — `localStorage.theme` ∈ light|dark|neo. light =
            neither class; dark = `.dark`; neo = `.dark` + `.neo`. Migrates the
            old build's `neo==='on'` flag to the `neo` theme on first read. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=document.documentElement;var t=localStorage.getItem('theme');if(localStorage.getItem('neo')==='on'){t='neo';localStorage.setItem('theme','neo');localStorage.removeItem('neo');}if(t!=='light'&&t!=='dark'&&t!=='neo'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}e.setAttribute('data-theme',t);e.classList.toggle('dark',t==='dark'||t==='neo');e.classList.toggle('neo',t==='neo');}catch(e){}})();`,
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
