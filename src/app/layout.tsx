import type { Metadata } from "next";
import { Header } from "@/components/header/header";
import "@/assets/styles/styles.scss";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { Mulish } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/providers/AuthProvider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";

const font = Mulish({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "!LAZY",
  description: "Лень — главный автор этого блога",
  authors: [{ name: "NotLazy", url: "https://notlazy.org" }],
  openGraph: {
    title: "!LAZY",
    description: "Ошибка 404: Лень не найдена",
    url: "https://notlazy.org",
    siteName: "NotLazy",
    // images: [
    //   {
    //     url: "https://notlazy.org/og-image.jpg",
    //     width: 1200,
    //     height: 630,
    //     alt: "NotLazy",
    //   },
    // ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    // card: "summary_large_image",
    title: "!LAZY",
    description: "Ошибка 404: Лень не найдена",
    // images: ["https://notlazy.org/og-image.jpg"],
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
      </head>

      <body className={font.className}>
        <ReactQueryProvider>
          <AuthProvider>
            {/* <ThemeProvider> */}
            <Header />
            <main className="layout-main">{children}</main>
            {/* </ThemeProvider> */}
          </AuthProvider>

          <Toaster position="top-right" />
          <Analytics />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
