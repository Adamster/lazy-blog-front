import { Mulish } from "next/font/google";
import { AppProviders } from "@/shared/providers/app-providers";

import "@/assets/styles/global.scss";
import RootHead from "./head";
import Script from "next/script";
import { Header } from "@/widgets/header";

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
      <Script
        crossOrigin="anonymous"
        src="//unpkg.com/react-scan/dist/auto.global.js"
      />

      <RootHead />

      <body className={`${font.variable}`}>
        <AppProviders>
          <Header />
          <main className="max-w-4xl mx-auto">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
