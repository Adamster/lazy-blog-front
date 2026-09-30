import "../assets/styles/tailwind.css";
import "../assets/styles/global.scss";
import "../assets/styles/prose.css";

import { GoogleAnalytics } from "@/shared/lib/head/google-analytics";
import { MetaLinks } from "@/shared/lib/head/meta-links";
import { AppProviders } from "@/app/app-providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Must be a RAW inline <script> so it runs SYNCHRONOUSLY during parse,
            before first paint — `next/script` beforeInteractive loads after first
            paint and reintroduces the light→dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=document.documentElement;var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}e.setAttribute('data-theme',t);e.classList.toggle('dark',t==='dark');e.classList.remove('neo');}catch(e){}})();`,
          }}
        />

        <GoogleAnalytics />
        <MetaLinks />
        <Analytics />
      </head>

      <body>
        <AppProviders>
          {/* Clears the fixed header bar for every route; intentionally
              full-width so each page owns its own horizontal constraint. */}
          <main className="pt-[var(--m-header-h)]">{children}</main>
        </AppProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
