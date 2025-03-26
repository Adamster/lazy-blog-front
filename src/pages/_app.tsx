import { Header } from "@/widgets/header";
import { AppProps } from "next/app";
import { GenerateMeta } from "@/shared/lib/head/meta-data";

import "@/assets/styles/global.scss";
import { AppProviders } from "@/shared/providers/app-providers";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GenerateMeta />

      <AppProviders>
        <Header />
        <main className="max-w-4xl mx-auto">
          <Component {...pageProps} />
        </main>
      </AppProviders>
    </>
  );
}
