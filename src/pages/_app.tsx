import { ThemeProvider } from "@/contexts/theme-context";
import Layout from "@/layout";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import "../assets/styles/styles.scss";

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default App;
